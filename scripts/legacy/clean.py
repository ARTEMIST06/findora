import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Remove multiple definitions of authLoading
code = re.sub(r'(const authLoading = store\.isAuthLoading\(\);\n\s*)+', 'const authLoading = store.isAuthLoading();\n', code)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

