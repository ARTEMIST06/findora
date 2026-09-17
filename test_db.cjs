const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  const adminApp = initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
  
  const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
  const defaultDb = getFirestore(adminApp);
  
  console.log("adminDb path:", adminDb.collection('test').doc('test').path);
  console.log("defaultDb path:", defaultDb.collection('test').doc('test').path);
}

run();
