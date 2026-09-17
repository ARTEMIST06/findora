const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ --- DRAFT PUBLISH API ---[\s\S]*?res\.status\(500\)\.json\(\{ success: false, message: "Internal server error" \}\);\n    \}\n  \}\);/g;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync('server.ts', content);
  console.log('Removed Draft Publish API from server.ts');
} else {
  console.error('Failed to find Draft Publish API in server.ts');
}
