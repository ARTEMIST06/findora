import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Add Import button next to Export button
export_btn_html = """          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : <Download className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Products'}</span>
            <span className="sm:hidden">{isExporting ? 'Wait' : 'Export'}</span>
          </button>"""

import_btn_html = """          <button
            onClick={() => setActiveTab('bulk-import')}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <FileUp className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Import Products</span>
            <span className="sm:hidden">Import</span>
          </button>"""

if export_btn_html in code:
    code = code.replace(export_btn_html, import_btn_html + "\n" + export_btn_html)
    print("Patched header button")
else:
    print("Could not find export button html block")

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

