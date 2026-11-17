import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# 1. Add tab button
tab_btn = """        <button
          onClick={() => setActiveTab('bulk-import')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'bulk-import'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Bulk Import</span>
        </button>
"""

if "onClick={() => setActiveTab('bulk-import')}" not in code:
    clicks_btn = r"        <button\n          onClick=\{\(\) => setActiveTab\('clicks'\)\}[\s\S]*?<span>Affiliate Outbound Clicks \(\{totalClicksCount\}\)<\/span>\n        <\/button>"
    
    # We will just append the new tab before the closing div of the tabs
    code = re.sub(r'(<span>Affiliate Outbound Clicks \(\{totalClicksCount\}\)</span>\s*</button>\s*</div>)', r'\1\n' + tab_btn, code)


# 2. Add BulkImport component block
bulk_import_content = """      {/* TAB: BULK IMPORT */}
      {activeTab === 'bulk-import' && (
        <BulkImport onImportComplete={() => setActiveTab('products')} />
      )}
"""

if "TAB: BULK IMPORT" not in code:
    code = code.replace("{/* TAB 1: OVERVIEW */}", bulk_import_content + "\n      {/* TAB 1: OVERVIEW */}")


with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("Patched bulk import tab")
