const products = [
  { id: '1', name: 'boAt Rockerz 371', featured: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'OCEANEVO Cosmetic', featured: true, createdAt: new Date().toISOString() },
  { id: '3', name: 'TrustBasket', featured: false, createdAt: new Date().toISOString() },
  { id: '4', name: 'Men Vegan', featured: false, createdAt: new Date().toISOString() },
  { id: '5', name: 'Pigeon', featured: false, createdAt: new Date().toISOString() },
  { id: '6', name: 'AGARO', featured: false, createdAt: new Date().toISOString() },
  { id: '7', name: 'Philips', featured: false, createdAt: new Date().toISOString() },
  { id: '8', name: 'Homesake', featured: false, createdAt: new Date().toISOString() },
  { id: '9', name: 'SpecialYou', featured: false, createdAt: new Date().toISOString() },
];

let featured = products.filter((p) => p.featured);
if (featured.length < 4) {
  const others = products.filter((p) => !p.featured).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  featured = [...featured, ...others].slice(0, 4);
} else {
  featured = featured.slice(0, 4);
}

console.log("Featured length:", featured.length);
console.log("Featured names:", featured.map(p => p.name));
