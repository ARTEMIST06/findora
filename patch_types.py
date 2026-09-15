import re

with open('src/types/index.ts', 'r') as f:
    code = f.read()

import_history_type = """
export interface ImportHistory {
  id: string;
  fileName: string;
  importedBy: string;
  importedAt: string;
  totalRows: number;
  imported: number;
  needsReview: number;
  skipped: number;
  failed: number;
}
"""

if "export interface ImportHistory" not in code:
    code += "\n" + import_history_type

with open('src/types/index.ts', 'w') as f:
    f.write(code)

print("done patching types")
