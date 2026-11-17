const fs = require('fs');
let content = fs.readFileSync('src/components/common/ProductCard.tsx', 'utf8');

const debugCode = `
  const mainImage = product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';
  console.log('Rendering ProductCard:', product.name, product.id);
  return (
`;

content = content.replace(
  /const mainImage = product.images\[0\] \|\| [^;]+;\n  return \(/,
  debugCode.trim()
);

fs.writeFileSync('src/components/common/ProductCard.tsx', content);
