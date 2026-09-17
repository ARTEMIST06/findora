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
  
  console.log("adminDb project:", adminDb.projectId);
  console.log("defaultDb project:", defaultDb.projectId);
  
  // Let's print the actual internal options
  console.log("adminDb databaseId:", adminDb._settings.databaseId);
  console.log("defaultDb databaseId:", defaultDb._settings.databaseId);
}

run();
