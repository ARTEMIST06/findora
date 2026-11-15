import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Offline persistence: repeat visits serve the catalogue from the on-device
// cache and only download changed documents (Firestore resume tokens), so a
// returning visitor costs ~0 reads instead of a full re-read of ~1,370 docs
// (684 products + 684 offers). First visits still read the full catalogue —
// the hard ceiling on new-visitor spikes is the Firebase plan's daily read
// quota, not this cache. Failures (multi-tab, unsupported browser) fall back
// silently to the default in-memory behaviour.
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => {});
}
