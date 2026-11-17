const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const firebaseConfig = JSON.parse(configStr);

const adminApp = initializeApp({
  credential: applicationDefault(),
  projectId: firebaseConfig.projectId,
});

const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

adminDb.collection('products').limit(1).get()
  .then(snap => {
    console.log("Success! Docs:", snap.size);
  })
  .catch(e => {
    console.error("Error:", e);
  });
