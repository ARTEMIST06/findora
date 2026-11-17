import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Remove the isExporting definition from its current place
code = code.replace("  const [isExporting, setIsExporting] = useState(false);\n\n  const handleExportExcel = () => {", "  const handleExportExcel = () => {")

# Insert it at the top with other state definitions
insert_point = "  const [fetchedFields, setFetchedFields] = useState<Record<string, boolean>>({});"
if insert_point in code:
    code = code.replace(insert_point, insert_point + "\n  const [isExporting, setIsExporting] = useState(false);")
else:
    print("Could not find insert point")

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("Hooks fixed")
