import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const newEmail = `test_read_${Date.now()}@example.com`;
    const cred = await createUserWithEmailAndPassword(auth, newEmail, 'password123');
    
    const uid = cred.user.uid;
    console.log("Created user", uid);
    
    // Simulate what store.ts does exactly
    const newUser = {
      id: uid,
      email: cred.user.email || '',
      name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
      role: 'shopper',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    try {
       await setDoc(doc(db, 'users', uid), newUser);
       console.log("Success creating user doc");
    } catch(e) {
       console.log("User doc fail:", e.message);
    }
    
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    process.exit(0);
  }
}
run();
