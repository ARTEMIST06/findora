import re

with open('server.ts', 'r') as f:
    code = f.read()

admin_setup = """import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let adminApp;
let adminDb;
try {
  const configStr = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  adminApp = initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
  adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
}
"""

delete_route = """
  // Account cleanup route (trusted backend workflow)
  app.post("/api/delete-account-cleanup", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const idToken = authHeader.split('Bearer ')[1];
      
      if (!adminApp || !adminDb) {
        return res.status(500).json({ success: false, message: "Admin SDK not initialized" });
      }
      
      const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      console.log(`[SECURITY] Processing backend data cleanup for user: ${uid}`);
      
      let errors = [];
      
      // 1. Delete security events (Immutable from client)
      try {
        const eventsSnapshot = await adminDb.collection('securityEvents').where('userId', '==', uid).get();
        if (!eventsSnapshot.empty) {
          const batch = adminDb.batch();
          eventsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      } catch (e) {
        console.error("Failed to delete securityEvents:", e);
        errors.push("securityEvents");
      }
      
      // 2. Delete user profile document (Client doesn't have delete permission in rules)
      try {
        await adminDb.collection('users').doc(uid).delete();
      } catch (e) {
        console.error("Failed to delete user profile:", e);
        errors.push("users");
      }
      
      // Note: Firebase Auth account deletion is handled safely by the client SDK to ensure 
      // reliable execution even if the server environment lacks identitytoolkit API scopes.
      
      if (errors.length > 0) {
        return res.status(207).json({ success: true, message: "Partial cleanup", errors });
      }
      
      res.json({ success: true, message: "Backend cleanup successful" });
    } catch (error) {
      console.error("[SECURITY] Delete Account Cleanup Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
"""

if "delete-account-cleanup" not in code:
    code = code.replace('import dotenv from "dotenv";', admin_setup + '\nimport dotenv from "dotenv";')
    code = code.replace('app.post("/api/fetch-product",', delete_route + '\n  app.post("/api/fetch-product",')
    with open('server.ts', 'w') as f:
        f.write(code)
    print("Patched server.ts with admin cleanup endpoint")
else:
    print("Already patched")
