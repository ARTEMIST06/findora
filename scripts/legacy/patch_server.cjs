const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Remove Vite top-level import
content = content.replace('import { createServer as createViteServer } from "vite";\n', '');

// 2. Add /api/health
content = content.replace(
  '  // API routes',
  '  // API routes\n  app.get("/api/health", (req, res) => res.json({ status: "ok" }));'
);

// 3. Lazy load Vite
content = content.replace(
  '    const vite = await createViteServer({',
  '    const { createServer: createViteServer } = await import("vite");\n    const vite = await createViteServer({'
);

fs.writeFileSync('server.ts', content);
