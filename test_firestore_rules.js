import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function runTest() {
  try {
    const email = `test_rules_${Date.now()}@example.com`;
    const password = "password123";
    console.log("1. Creating user...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;
    console.log("Auth User created:", uid);

    console.log("2. Attempting to create user document...");
    const newUser = {
      id: uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'User',
      role: 'shopper',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', uid), newUser);
      console.log("User doc created successfully.");
    } catch (e) {
      console.error("Firestore Error creating user doc:", e.message);
    }
  } catch (e) {
    console.error("Test failed:", e.message);
  } finally {
    process.exit(0);
  }
}

runTest();
