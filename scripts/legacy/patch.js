import fs from 'fs';

const content = fs.readFileSync('src/components/public/TrendingProducts.tsx', 'utf8');
const newContent = content.replace(
  '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">',
  `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DEBUG OVERLAY */}
        <div style={{gridColumn: '1 / -1', background: '#fee', padding: 10, fontSize: 12}}>
          <strong>DEBUG:</strong> 
          Firestore Products Loaded: {products.length}. 
          Featured Array: {featured.length}.
          Products: {products.map(p => p.name).join(', ')}
        </div>`
);
fs.writeFileSync('src/components/public/TrendingProducts.tsx', newContent);
