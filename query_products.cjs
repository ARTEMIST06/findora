const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  const adminApp = initializeApp({
    projectId: firebaseConfig.projectId,
  });
  const db = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
  });

  try {
      const snapshot = await db.collection('products').get();
      if (snapshot.empty) {
          console.log("No products found.");
          return;
      }
      snapshot.forEach(doc => {
          console.log(doc.id, "=>", doc.data());
      });
  } catch(e) {
      console.error(e);
  }
}

run();
