import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const newEmail = `test_secevent_${Date.now()}@example.com`;
    const cred = await createUserWithEmailAndPassword(auth, newEmail, 'password123');
    const uid = cred.user.uid;
    console.log("Created user", uid);
    
    // Attempt to log security event
    const eventId = `sec-${Date.now()}`;
    await setDoc(doc(db, 'users', uid), {
        id: uid,
        email: newEmail,
        name: 'Normal User',
        role: 'shopper',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
    });
    console.log("Success logging user event");
    
  } catch (e) {
    console.log("ERROR:", e.code || e.message);
  } finally {
    process.exit(0);
  }
}
run();
