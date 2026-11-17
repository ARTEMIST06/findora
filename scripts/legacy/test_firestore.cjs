const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  
  const db = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
  });

  try {
      const doc = await db.collection('test').doc('test').get();
      console.log(doc.exists);
  } catch(e) {
      console.error(e);
  }
}

run();
