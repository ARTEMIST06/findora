import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

# I will fix the duplicate injection
code = code.replace("""                          {importResult && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-emerald-800">Import Complete</h4>
                  <div className="flex space-x-6 text-sm font-semibold">
                    <span className="text-emerald-700">✓ Imported: {importResult.imported}</span>
                    <span className="text-amber-700">⚠ Needs Review: {importResult.needsReview}</span>
                    <span className="text-red-700">❌ Failed: {importResult.failed}</span>
                  </div>
                </div>
              )}
""", "")

# Now specifically target the preview table overflow div
preview_table_start = """              {isImporting && (
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

              <div className="overflow-x-auto">"""

preview_table_fixed = """              {isImporting && (
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

              {importResult && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-emerald-800">Import Complete</h4>
                  <div className="flex space-x-6 text-sm font-semibold">
                    <span className="text-emerald-700">✓ Imported: {importResult.imported}</span>
                    <span className="text-amber-700">⚠ Needs Review: {importResult.needsReview}</span>
                    <span className="text-red-700">❌ Failed: {importResult.failed}</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">"""

code = code.replace(preview_table_start, preview_table_fixed)

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

print("done rewriting bulk import")
