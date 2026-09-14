import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const configStr = readFileSync('firebase-applet-config.json', 'utf-8');
const config = JSON.parse(configStr);

const app = initializeApp(config.firebaseConfig || config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const email = `testuser_${Date.now()}@example.com`;
  
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Auth state changed to logged in:", user.uid);
      const userRef = doc(db, 'users', user.uid);
      const newUser = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'User',
        role: 'shopper',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      try {
        await setDoc(userRef, newUser);
        console.log("setDoc create success");
      } catch (e) {
        console.error("setDoc create error:", e.message);
      }
      
      try {
        await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
        console.log("setDoc merge update success");
      } catch (e) {
        console.error("setDoc merge update error:", e.message);
      }

      try {
        await setDoc(userRef, { role: 'admin' }, { merge: true });
        console.log("setDoc role update success (BAD!)");
      } catch (e) {
        console.log("setDoc role update failed as expected:", e.message);
      }
      
      process.exit(0);
    }
  });

  await createUserWithEmailAndPassword(auth, email, 'password123');
}
run();
