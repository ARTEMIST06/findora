const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

content = content.replace(
  "import { useEffect, useState } from 'react';",
  "import { useEffect, useState, useSyncExternalStore } from 'react';"
);

content = content.replace(
  "const EVENT_NAME = 'findora_store_changed';",
  "const EVENT_NAME = 'findora_store_changed';\nlet storeVersion = 0;"
);

content = content.replace(
  "function notifyChange() {\n  if (typeof window !== 'undefined') {\n    window.dispatchEvent(new CustomEvent(EVENT_NAME));\n  }\n}",
  "function notifyChange() {\n  storeVersion++;\n  if (typeof window !== 'undefined') {\n    window.dispatchEvent(new CustomEvent(EVENT_NAME));\n  }\n}"
);

content = content.replace(
  "export function useFindoraStore() {\n  const [, setTick] = useState(0);\n\n  useEffect(() => {\n    const handleStoreChange = () => setTick((prev) => prev + 1);\n    window.addEventListener(EVENT_NAME, handleStoreChange);\n    return () => window.removeEventListener(EVENT_NAME, handleStoreChange);\n  }, []);\n\n  return findoraStore;\n}",
  "export function useFindoraStore() {\n  useSyncExternalStore(\n    (listener) => {\n      window.addEventListener(EVENT_NAME, listener);\n      return () => window.removeEventListener(EVENT_NAME, listener);\n    },\n    () => storeVersion\n  );\n  return findoraStore;\n}"
);

fs.writeFileSync('src/services/store.ts', content);
