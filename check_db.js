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
    const db = getFirestore(app, config.firestoreDatabaseId);
    const users = await db.collection('users').get();
    console.log("Total users:", users.size);
    users.docs.forEach(d => console.log(d.id, d.data().role, d.data().name));
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}
run();
