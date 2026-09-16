import re

with open("server.ts", "r") as f:
    content = f.read()

# Remove console.error("Amazon API Authentication Error:"...
content = re.sub(r'console\.error\("Amazon API Authentication Error:",.*?\);', '', content)
# Remove console.error("Amazon API Error:", JSON.stringify(apiData));
content = re.sub(r'console\.error\("Amazon API Error:",.*?\);', '', content)
# Remove console.error("Amazon API Exception:", e);
content = re.sub(r'console\.error\("Amazon API Exception:",.*?\);', '', content)
# Remove console.log(`Amazon API failed ...
content = re.sub(r'console\.log\(`Amazon API failed.*?\);', '', content)

with open("server.ts", "w") as f:
    f.write(content)

