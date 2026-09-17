import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  try {
      const snapshot = await getDocs(collection(db, 'offers'));
      console.log("Found", snapshot.size, "offers");
      snapshot.forEach(doc => {
          console.log(doc.id, "=> productId:", doc.data().productId, "storeId:", doc.data().storeId, "price:", doc.data().price);
      });
  } catch(e) {
      console.error(e);
  }
  process.exit(0);
}
run();
