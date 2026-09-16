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
    
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      email: newEmail,
      name: 'User',
      role: 'shopper',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });
    
    const docSnap = await getDoc(doc(db, 'users', uid));
    console.log("Doc exists:", docSnap.exists());
    if(docSnap.exists()) {
      console.log("Data:", docSnap.data());
    }
    
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    process.exit(0);
  }
}
run();
