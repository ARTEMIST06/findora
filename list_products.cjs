const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const configStr = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
const firebaseConfig = JSON.parse(configStr);
const adminApp = initializeApp({
  credential: applicationDefault(),
  projectId: firebaseConfig.projectId,
});
const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

(async () => {
  const snapshot = await adminDb.collection('products').limit(5).get();
  snapshot.forEach(doc => console.log(doc.id));
  process.exit(0);
})();
