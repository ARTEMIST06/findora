const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

content = content.replace(
  "const EVENT_NAME = 'findora_store_change';",
  "const EVENT_NAME = 'findora_store_change';\nlet storeVersion = 0;"
);

fs.writeFileSync('src/services/store.ts', content);
