import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function runTest() {
  try {
    console.log("1. Creating test user...");
    const email = `testdel_${Date.now()}@example.com`;
    const password = "password123";
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;
    console.log("User created:", uid);

    console.log("2. Creating private data (wishlist)...");
    await setDoc(doc(db, 'wishlists', uid), { items: ['prod1'] });
    console.log("Data created.");

    console.log("3. Triggering deletion via frontend logic simulation...");
    const idToken = await user.getIdToken(true);
    const res = await fetch('http://localhost:3000/api/delete-account-cleanup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    const resData = await res.json();
    console.log("Backend response:", resData);

    console.log("4. Deleting Auth user directly (simulating frontend)...");
    await user.delete();
    console.log("Auth user deleted.");

    console.log("5. Verifying Auth deletion...");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("ERROR: User still exists!");
    } catch (e) {
      console.log("SUCCESS: User cannot sign in (deleted).");
    }

  } catch (e) {
    console.error("Test failed:", e);
  }
}

runTest();
