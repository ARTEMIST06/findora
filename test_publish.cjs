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

  try {
      const draft = { id: 'test_draft_123', title: 'Test Title' };
      const batch = adminDb.batch();
      
      batch.set(adminDb.collection("products").doc('prod_123'), { name: 'test' });
      batch.set(adminDb.collection("offers").doc('off_123'), { name: 'test' });
      batch.set(adminDb.collection("productDrafts").doc(draft.id), draft, { merge: true });
      
      console.log("Committing batch...");
      await batch.commit();
      console.log("Batch successful");
  } catch(e) {
      console.error(e);
  }
}

run();
