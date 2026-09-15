import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Fix the button placement
old_str = """        <button
          onClick={() => setActiveTab('clicks')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'clicks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MousePointerClick className="w-4 h-4" />
          <span>Affiliate Outbound Clicks ({totalClicksCount})</span>
        </button>
      </div>
        <button
          onClick={() => setActiveTab('bulk-import')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'bulk-import'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Bulk Import</span>
        </button>"""

new_str = """        <button
          onClick={() => setActiveTab('clicks')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'clicks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MousePointerClick className="w-4 h-4" />
          <span>Affiliate Outbound Clicks ({totalClicksCount})</span>
        </button>
        <button
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
      </div>"""

if old_str in code:
    code = code.replace(old_str, new_str)
    with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
        f.write(code)
    print("Fixed")
else:
    print("Not found")

