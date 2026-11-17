const fs = require('fs');
let content = fs.readFileSync('src/pages/public/HomePage.tsx', 'utf8');

// Add import
content = content.replace(
  "import { ComparisonHighlight } from '../../components/public/ComparisonHighlight';",
  "import { ComparisonHighlight } from '../../components/public/ComparisonHighlight';\nimport { RecentlyAdded } from '../../components/public/RecentlyAdded';"
);

// Add section
content = content.replace(
  "<TrendingProducts onNavigate={onNavigate} />",
  "<TrendingProducts onNavigate={onNavigate} />\n      <RecentlyAdded onNavigate={onNavigate} />"
);

fs.writeFileSync('src/pages/public/HomePage.tsx', content);
