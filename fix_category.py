with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

old_suggest = "else if (t.includes('perfume') || t.includes('fragrance') || t.includes('cologne') || t.includes('beauty')) suggested = 'Beauty';"
new_suggest = "else if (t.includes('perfume') || t.includes('fragrance') || t.includes('cologne') || t.includes('beauty')) suggested = 'Beauty & Personal Care';"

content = content.replace(old_suggest, new_suggest)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)
