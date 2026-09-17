import re

with open("src/utils/drafts.ts", "r") as f:
    content = f.read()

# Fix getMissingDraftFields to also treat NaN as missing
content = content.replace("return val === null || val === undefined || val === '';", "return val === null || val === undefined || val === '' || Number.isNaN(val);")

with open("src/utils/drafts.ts", "w") as f:
    f.write(content)

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("return val === null || val === undefined || val === '';", "return val === null || val === undefined || val === '' || Number.isNaN(val);")

with open("server.ts", "w") as f:
    f.write(content)

