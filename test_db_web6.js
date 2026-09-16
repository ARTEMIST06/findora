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
    const newEmail = `test_read_${Date.now()}@example.com`;
    const cred = await createUserWithEmailAndPassword(auth, newEmail, 'password123');
    
    const uid = cred.user.uid;
    console.log("Created user", uid);
    
    await new Promise(r => setTimeout(r, 2000)); // WAIT
    
    const eventId = `sec-${Date.now()}`;
    await setDoc(doc(db, 'securityEvents', eventId), {
        id: eventId,
        userId: uid,
        eventType: 'account_creation',
        details: null,
        timestamp: new Date().toISOString()
    });
    console.log("Success logging security event");
    
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    process.exit(0);
  }
}
run();
