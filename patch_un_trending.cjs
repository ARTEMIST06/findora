const fs = require('fs');
let content = fs.readFileSync('src/components/public/TrendingProducts.tsx', 'utf8');

content = content.replace(
  /  console\.log\('--- DEBUG HOMEPAGE ---'\);[\s\S]*?console\.log\('Featured product names:', featured\.map\(p => p\.name\)\.join\(', '\)\);/,
  ""
);

content = content.replace(
  /        \{\/\* DEBUG OVERLAY \*\/\}[\s\S]*?<\/div>/,
  ""
);

fs.writeFileSync('src/components/public/TrendingProducts.tsx', content);
