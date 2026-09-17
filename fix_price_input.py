import re

with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

# Replace: onChange={(e) => handleChange('currentPrice', Number(e.target.value))}
# With: onChange={(e) => handleChange('currentPrice', e.target.value === '' ? null : Number(e.target.value))}

content = content.replace(
    "onChange={(e) => handleChange('currentPrice', Number(e.target.value))}", 
    "onChange={(e) => handleChange('currentPrice', e.target.value === '' ? null : Number(e.target.value))}"
)

content = content.replace(
    "onChange={(e) => handleChange('mrp', Number(e.target.value))}", 
    "onChange={(e) => handleChange('mrp', e.target.value === '' ? null : Number(e.target.value))}"
)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)

