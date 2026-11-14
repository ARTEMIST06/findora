import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
const cfg = JSON.parse(readFileSync('firebase-applet-config.json','utf8'));
const app = initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, storageBucket: cfg.storageBucket, messagingSenderId: cfg.messagingSenderId, appId: cfg.appId });
const db = getFirestore(app, cfg.firestoreDatabaseId);
for (const coll of ['products','offers','stores','categories']) {
  try {
    const snap = await getDocs(collection(db, coll));
    console.log(coll, '->', snap.size, 'docs');
  } catch (e) { console.log(coll, '-> ERROR', e.code, e.message.slice(0,120)); }
}
process.exit(0);
