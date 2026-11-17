const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  try {
      const snapshot = await getDocs(collection(db, 'products'));
      console.log("Found", snapshot.size, "products");
      snapshot.forEach(doc => {
          console.log(doc.id, "=> name:", doc.data().name, "published:", doc.data().published, "featured:", doc.data().featured, "createdAt:", doc.data().createdAt);
      });
  } catch(e) {
      console.error(e);
  }
  process.exit(0);
}

run();
