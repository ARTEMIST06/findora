import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    // Attempting to read a user doc as that user
    const email = `test2_1726511752495@example.com`; // From previous test
    // let's just make a new one and read it
    const newEmail = `test_read_${Date.now()}@example.com`;
    const cred = await getAuth().createUserWithEmailAndPassword(newEmail, 'password123');
    
    // AuthPages flow sets up profile, then store.ts onAuthStateChanged creates user doc
    const uid = cred.user.uid;
    console.log("Created user", uid);
    
    // try to get the doc that should have been created by onAuthStateChanged? No, this is backend node.js so no store.ts is running.
    // Let's just create it.
    await getFirestore().collection('users').doc(uid).set({
      id: uid,
      email: newEmail,
      name: 'User',
      role: 'shopper',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });
    
    const docSnap = await getDoc(doc(db, 'users', uid));
    console.log("Doc exists:", docSnap.exists());
    
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    process.exit(0);
  }
}
run();
