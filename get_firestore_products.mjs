import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  try {
      const snapshot = await getDocs(collection(db, 'products'));
      console.log("Total products in Firestore:", snapshot.size);
      snapshot.forEach(doc => {
          console.log(doc.id, "=> name:", doc.data().name, "published:", doc.data().published, "featured:", doc.data().featured, "createdAt:", doc.data().createdAt);
      });
  } catch(e) {
      console.error("Error fetching products:", e);
  }
  process.exit(0);
}
run();
