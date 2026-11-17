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

const brands = [
  "Apple", "Samsung", "OnePlus", "Xiaomi", "Sony", "JBL", "Bose", "Anker", "UGREEN", "Logitech",
  "Dell", "HP", "Lenovo", "ASUS", "Acer", "TP-Link", "Philips", "Dyson", "Havells", "Bajaj",
  "Prestige", "Pigeon", "Wonderchef", "Borosil", "Milton", "Wakefit", "SleepyCat", "Decathlon",
  "Garmin", "Amazfit", "boAt", "Noise", "Fossil", "LEGO", "R for Rabbit", "LuvLap", "Oral-B", "Braun",
  "Microsoft", "Google", "Nothing", "Motorola", "Realme", "Vivo", "Oppo", "LG", "Whirlpool", "Godrej",
  "Voltas", "Panasonic", "IFB", "Bosch", "Siemens", "TCL", "Hisense", "Vu", "Blaupunkt", "Marshall",
  "Sennheiser", "Skullcandy", "Boult", "Mivi", "Zebronics", "Portronics", "Spigen", "Spigen", // duplicate test
  "Belkin", "Ambrane", "Syska", "Crompton", "Orient", "V-Guard", "Symphony", "Kenstar", "Morphy Richards",
  "Black+Decker", "Eureka Forbes", "Kent", "Livpure", "HUL Pureit", "Aquaguard", "Cello", "Tupperware",
  "Treo", "Nayasa", "IKEA", "Herman Miller", "Steelcase", "Green Soul", "Cellbell", "Sleepwell",
  "Duroflex", "Sunday", "Kurl-on", "Adidas", "Nike", "Puma", "Reebok", "Asics", "New Balance", "Skechers",
  "Yonex", "Nivia", "Cosco", "Fastrack", "Casio", "Titan", "Timex", "Rolex", "Seiko", "Citizen", "Tommy Hilfiger",
  "Gillette", "Nivea", "Dove", "L'Oreal", "Maybelline", "Lakme", "Mamaearth", "WOW Skin Science", "Plum"
];

(async () => {
  const uniqueBrands = [...new Set(brands)];
  let count = 0;
  for (const b of uniqueBrands) {
    const id = b.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await adminDb.collection('brands').doc(id).set({
      id,
      name: b
    });
    count++;
  }
  
  const categories = [
    "Electronics", "Mobiles & Accessories", "Computers & Accessories", "Audio", "Cameras", "TV & Home Entertainment",
    "Smart Home", "Large Appliances", "Small Appliances", "Kitchen", "Home", "Furniture", "Home Improvement",
    "Beauty", "Personal Care", "Health", "Grocery", "Baby Products", "Toys & Games", "Sports & Fitness",
    "Luggage & Travel", "Automotive", "Books", "Office Products", "Pet Supplies", "Garden & Outdoor",
    "Fashion", "Shoes", "Watches", "Jewellery", "Musical Instruments", "Tools", "Industrial & Scientific"
  ];
  
  for (const c of categories) {
    const id = c.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await adminDb.collection('categories').doc(id).set({
      id,
      slug: id,
      name: c,
      icon: '',
      description: '',
      popularBrands: []
    });
  }
  
  console.log(`Seeded ${count} brands and ${categories.length} categories.`);
})();
