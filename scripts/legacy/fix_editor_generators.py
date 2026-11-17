with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

old_pitch = "const txt = `[AI suggestion — review before saving] The ${draft.title} from ${draft.brand} is an excellent choice in the ${draft.category || 'electronics'} category, offering premium performance and great value.`;"
new_pitch = "const txt = `The ${draft.title} from ${draft.brand} is an excellent choice in the ${draft.category || 'electronics'} category, offering premium performance and great value.`;"
content = content.replace(old_pitch, new_pitch)

old_why = "const txt = `[AI suggestion — review before saving] Findora picked the ${draft.title} because it provides outstanding quality compared to its price point. We've tracked its pricing to ensure you get the best deal available today.`;"
new_why = "const txt = `Findora picked the ${draft.title} because it provides outstanding quality compared to its price point. We've tracked its pricing to ensure you get the best deal available today.`;"
content = content.replace(old_why, new_why)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)
