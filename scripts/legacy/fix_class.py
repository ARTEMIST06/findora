import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

code = code.replace("    notifyChange();\n  }\n}\n\n  // --- PRICE ALERTS ---", "    notifyChange();\n  }\n\n  // --- PRICE ALERTS ---")

with open('src/services/store.ts', 'w') as f:
    f.write(code)

