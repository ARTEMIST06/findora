import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

# Add state
code = code.replace(
    "const [importProgress, setImportProgress] = useState(0);",
    "const [importProgress, setImportProgress] = useState(0);\n  const [importResult, setImportResult] = useState<{imported: number, needsReview: number, failed: number} | null>(null);"
)

# Reset result on file upload
code = code.replace("setProcessedRows([]);", "setProcessedRows([]);\n    setImportResult(null);")

# Update handleImport
import_complete_old = """
    setIsImporting(false);
    loadHistory();
    alert(`Import Complete. Imported: ${imported}, Failed: ${failed}, Skipped/Needs Review: ${skipped}`);
"""

import_complete_new = """
    setIsImporting(false);
    loadHistory();
    setImportResult({ imported, needsReview: skipped, failed });
"""

code = code.replace(import_complete_old.strip(), import_complete_new.strip())

# Show result UI
result_ui = """
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
"""

# inject before table
code = code.replace('<div className="overflow-x-auto">', result_ui + '\n              <div className="overflow-x-auto">')


with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

print("done patching results")
