import express from "express";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from "path";
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';

let adminApp;
let adminDb;
try {
  const configStr = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  adminApp = initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
  adminDb = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
  });
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
}

import dotenv from "dotenv";

dotenv.config();






async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the first proxy (e.g. Nginx, Cloud Run) so rate limiting identifies client IPs correctly
  app.set('trust proxy', 1);

  // Apply Helmet for production security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://apis.google.com", 
          "https://www.gstatic.com",
          "https://*.firebaseapp.com",
          "https://www.google.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "*"], // allow external product images
        connectSrc: [
          "'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com", 
          "wss://*.firebaseio.com",
          "ws://localhost:*", // Vite HMR
          "http://localhost:*", // Vite HMR
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://*.firebaseapp.com"
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com",
          "https://www.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        frameAncestors: ["'self'", "https://aistudio.google.com", "https://*.googleusercontent.com"], // Allow AI Studio iframe preview
      },
    },
    xFrameOptions: false, // Disable X-Frame-Options to allow framing in AI Studio preview
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Prevents loading external product images if enabled
  }));

  // Add Permissions-Policy (Helmet v7 removed it from default, we add it manually)
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });


  app.use(express.json());

  // Configure rate limiter for external API fetches


  // API routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  
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



  app.get("/api/dump-products", async (req, res) => {
    try {
      const snapshot = await adminDb.collection("products").get();
      const products = [];
      snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
      res.json(products);
    } catch(e) {
      res.status(500).json({error: e.toString()});
    }
  });

  

  

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`); console.log("AWS_ID:", process.env.AMAZON_CREATORS_API_CREDENTIAL_ID ? "Set" : "Not Set");
  });
}

startServer();
