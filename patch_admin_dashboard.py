import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

code = code.replace(
    "const handleSaveOffer = (e: React.FormEvent) => {",
    "const handleSaveOffer = async (e: React.FormEvent) => {"
)

code = code.replace(
    "store.setOffer(targetProductIdForOffer,",
    "await store.setOffer(targetProductIdForOffer,"
)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done patching AdminDashboard.tsx")
