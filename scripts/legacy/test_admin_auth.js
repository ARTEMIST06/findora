import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId,
});

async function run() {
  try {
    await getAuth(app).deleteUser('dummy_uid');
    console.log("SUCCESS");
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}
run();
