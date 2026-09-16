const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testRBAC() {
  try {
    const email = `test_rbac_${Date.now()}@example.com`;
    const password = 'password123';
    console.log("Creating new user...");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    console.log("Auth successful. UID:", uid);
    
    // Simulate frontend self-promoting to admin
    console.log("Attempting to self-promote to admin...");
    try {
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        email: email,
        name: 'Malicious User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
      console.log("Self-promotion: FAIL (Allowed to create admin)");
    } catch(e) {
      if(e.code === 'permission-denied') {
        console.log("Self-promotion: PASS (Blocked by security rules)");
      } else {
        console.log("Self-promotion: Error", e.code);
      }
    }
    
    console.log("Attempting to create valid shopper...");
    try {
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        email: email,
        name: 'Normal User',
        role: 'shopper',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
      console.log("Shopper creation: PASS");
    } catch(e) {
      console.log("Shopper creation: FAIL", e.code);
    }
    
    process.exit(0);
  } catch(e) {
    console.error("Failed:", e.message);
    process.exit(1);
  }
}
testRBAC();
