import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "test_secevent_1789584424602@example.com", "password123");
    const uid = cred.user.uid;
    console.log("Signed in user", uid);
    
    // Attempt to log security event
    const eventId = `sec-${Date.now()}`;
    await setDoc(doc(db, 'securityEvents', eventId), {
        id: eventId,
        userId: uid,
        eventType: 'account_creation',
        details: null,
        timestamp: new Date().toISOString()
    });
    console.log("Success logging user event");
    
  } catch (e) {
    console.log("ERROR:", e.code || e.message);
  } finally {
    process.exit(0);
  }
}
run();
