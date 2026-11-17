import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

progress_old = """
              {isImporting && (
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${importProgress}%` }}></div>
                </div>
              )}
"""

progress_new = """
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>Importing products...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${importProgress}%` }}></div>
                  </div>
                </div>
              )}
"""

code = code.replace(progress_old.strip(), progress_new.strip())

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

print("done patching progress")
