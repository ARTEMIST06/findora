const fs = require('fs');
let content = fs.readFileSync('src/components/public/BestDealsSection.tsx', 'utf8');

content = content.replace(
  "  const deals = products\n    .filter((p) => p.maxDiscountPercent && p.maxDiscountPercent > 0)\n    .sort((a, b) => (b.maxDiscountPercent || 0) - (a.maxDiscountPercent || 0))\n    .slice(0, 4);",
  "  const deals = products\n    .filter((p) => p.maxDiscountPercent && p.maxDiscountPercent > 0)\n    .sort((a, b) => (b.maxDiscountPercent || 0) - (a.maxDiscountPercent || 0))\n    .slice(0, 4);\n\n  if (deals.length === 0) return null;"
);

fs.writeFileSync('src/components/public/BestDealsSection.tsx', content);
