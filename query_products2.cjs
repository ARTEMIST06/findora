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
  
  // Use getFirestore but we'll try to find out where products are saved.
  // We can just use the adminDb from server.ts which we changed to new Firestore() 
  // Let's just import the Firestore directly
  const { Firestore } = require('@google-cloud/firestore');
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
