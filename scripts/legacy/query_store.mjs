import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

async function run() {
  const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const pSnap = await getDocs(collection(db, 'products'));
  const products = pSnap.docs.map(d => ({...d.data(), id: d.id}));
  
  let featured = products.filter((p) => p.featured && p.published);
  console.log("Featured published:", featured.length, featured.map(f => f.name));
  
  if (featured.length < 4) {
    const others = products.filter((p) => !p.featured && p.published).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    console.log("Others published:", others.length, others.map(f => f.name));
    featured = [...featured, ...others].slice(0, 4);
  } else {
    featured = featured.slice(0, 4);
  }
  
  console.log("Final Trending:", featured.map(f => f.name));
  process.exit(0);
}
run();
