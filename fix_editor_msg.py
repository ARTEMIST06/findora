import re

with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "showToast('Product info applied successfully.', 'success');",
    "showToast('Fetched available product metadata. Some fields still need manual entry.', 'success');"
)
content = content.replace(
    "showToast('Fetched available product metadata, but no changes were applied.', 'success');",
    "showToast('Fetched available product metadata. Some fields still need manual entry.', 'success');"
)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)

