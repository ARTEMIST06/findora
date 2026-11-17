const fs = require('fs');
let content = fs.readFileSync('src/components/common/ProductCard.tsx', 'utf8');

content = content.replace(
  "console.log('Rendering ProductCard:', product.name, product.id);",
  ""
);

fs.writeFileSync('src/components/common/ProductCard.tsx', content);
