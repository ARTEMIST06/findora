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
  
  const oSnap = await getDocs(collection(db, 'offers'));
  const offers = oSnap.docs.map(d => ({...d.data(), id: d.id}));

  // Simulate getProductWithPrices
  const productsWithPrices = products.map(product => {
      const allOffers = offers.filter((o) => o.productId === product.id);
      return {
          ...product,
          offers: allOffers
      };
  });
  
  const publishedProducts = productsWithPrices.filter(p => p.published);
  console.log("Total published:", publishedProducts.length);
  
  // TrendingProducts logic
  let featured = publishedProducts.filter((p) => p.featured);
  console.log("Featured count:", featured.length);
  
  if (featured.length < 4) {
      const others = publishedProducts.filter((p) => !p.featured).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      featured = [...featured, ...others].slice(0, 4);
  } else {
      featured = featured.slice(0, 4);
  }
  
  console.log("TrendingProducts will show:", featured.map(p => p.name));
  process.exit(0);
}
run();
