const fs = require('fs');
let content = fs.readFileSync('src/components/common/ProductCard.tsx', 'utf8');

content = content.replace(
  'const mainImage = product.images[0] ||',
  'const mainImage = (product.images && product.images[0]) ||'
);

fs.writeFileSync('src/components/common/ProductCard.tsx', content);
