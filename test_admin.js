import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId,
});

async function run() {
  try {
    const db = getFirestore(app); // No explicit databaseId
    const snapshot = await db.collection('securityEvents').limit(1).get();
    console.log("SUCCESS DEFAULT:", snapshot.size);
  } catch (e) {
    console.log("ERROR DEFAULT:", e.message);
  }
}
run();
