const fs = require('fs');
let content = fs.readFileSync('src/components/public/TrendingProducts.tsx', 'utf8');
content = content.replace(/console\.log\("\[DEBUG\] Total products in TrendingProducts:".*?\);\n/s, '');
fs.writeFileSync('src/components/public/TrendingProducts.tsx', content);
