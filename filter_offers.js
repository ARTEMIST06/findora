const fs = require('fs');
const content = fs.readFileSync('src/data/mockData.ts', 'utf8');

// The file has a massive INITIAL_PRICE_OFFERS array at the end.
// We want to remove any object where storeId !== 'store-amazon'

let newContent = content;

// I can just replace the INITIAL_PRICE_OFFERS with a filtered version if I could parse it, but it's typescript.
