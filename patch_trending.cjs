const fs = require('fs');
let content = fs.readFileSync('src/components/public/TrendingProducts.tsx', 'utf8');

const debugCode = `
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  
  let featured = products.filter((p) => p.featured);
  if (featured.length < 4) {
    const others = products.filter((p) => !p.featured).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    featured = [...featured, ...others].slice(0, 4);
  } else {
    featured = featured.slice(0, 4);
  }

  console.log('--- DEBUG HOMEPAGE ---');
  console.log('TrendingProducts total products:', products.length);
  console.log('TrendingProducts featured products:', featured.length);
  console.log('Featured product names:', featured.map(p => p.name).join(', '));
`;

content = content.replace(
  /const store = useFindoraStore\(\);[\s\S]*?featured = featured\.slice\(0, 4\);\n  \}/,
  debugCode.trim()
);

fs.writeFileSync('src/components/public/TrendingProducts.tsx', content);
