import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

early_returns_pattern = re.compile(
    r'(  const authLoading = store\.isAuthLoading\(\);.*?  if \(currentUser\.role !== \'admin\'\) \{.*?      </div>\n    \);\n  \})',
    re.DOTALL
)

match = early_returns_pattern.search(code)
if match:
    early_returns_code = match.group(1)
    code = code.replace(early_returns_code, "")
    
    # Let's find a place AFTER all useStates
    insert_point = "  // Role check guard: If shopper, show permission message"
    code = code.replace(insert_point, "  const authLoading = store.isAuthLoading();\n" + early_returns_code + "\n\n" + insert_point)
    with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
        f.write(code)
    print("Fixed hooks properly")
else:
    print("Pattern not found")

