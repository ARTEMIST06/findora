import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

def replace_label(field, state_key):
    global code
    pattern = r'(<label className="font-semibold text-slate-700">)(' + field + r')(\s*\*?\s*)(</label>)'
    replacement = r'\1\2\3{fetchedFields.' + state_key + r' && idx === 0 && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ Fetched</span>}\4'
    code = re.sub(pattern, replacement, code)

replace_label('Affiliate/Tracking URL', 'affiliateUrl')

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done update_ui3")
