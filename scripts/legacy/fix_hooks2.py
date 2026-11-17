import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Let's extract the early returns
early_returns_pattern = re.compile(
    r'(  const authLoading = store\.isAuthLoading\(\);.*?  if \(currentUser\.role !== \'admin\'\) \{.*?      </div>\n    \);\n  \})',
    re.DOTALL
)

match1 = early_returns_pattern.search(code)
if match1:
    early_returns_code = match1.group(1)
    # Remove early returns
    code = code.replace(early_returns_code, "  const authLoading = store.isAuthLoading();\n")
    
    # Let's find where to re-insert them. Just before `const isAdmin = true;` or `const products = ...`
    insert_point = "  const isAdmin = true;"
    code = code.replace(insert_point, early_returns_code + "\n\n" + insert_point)
    
    with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
        f.write(code)
    print("Fixed via regex")
else:
    print("Pattern not found")

