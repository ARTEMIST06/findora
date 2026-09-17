const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  const adminApp = initializeApp({
    projectId: firebaseConfig.projectId,
  });
  const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

  try {
      const batch = adminDb.batch();
      batch.set(adminDb.collection("productDrafts").doc("does_not_exist_at_all_123"), { name: 'test' }, { merge: true });
      await batch.commit();
      console.log("Success");
  } catch(e) {
      console.error(e);
  }
}

run();
