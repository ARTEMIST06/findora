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
  
  const { Firestore } = require('@google-cloud/firestore');
  const db = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
  });

  try {
      const snapshot = await db.collection('products').get();
      console.log("Found", snapshot.size, "products");
      snapshot.forEach(doc => {
          console.log(doc.id, "=> published:", doc.data().published, "featured:", doc.data().featured);
      });
  } catch(e) {
      console.error(e);
  }
}

run();
