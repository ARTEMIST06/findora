import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

def replace_label(field, state_key):
    global code
    pattern = r'(<label className="font-semibold text-slate-700">)(' + field + r')(\s*\*?\s*)(</label>)'
    # Use re.sub to inject the Fetched indicator
    replacement = r'\1\2\3{fetchedFields.' + state_key + r' && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ Fetched</span>}\4'
    code = re.sub(pattern, replacement, code)

replace_label('Product Title', 'name')
replace_label('Brand', 'brand')
replace_label('Category', 'category')
replace_label('Image URL', 'images')

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done update_ui")
