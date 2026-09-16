import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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
    
    const userRef = doc(db, 'users', uid);
    try {
        const snap = await getDoc(userRef);
        console.log("getDoc success:", snap.exists());
    } catch(e) {
        console.log("getDoc FAIL:", e.message);
    }
    
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    process.exit(0);
  }
}
run();
