import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace the specific message for API Failed to match what the user requested
content = content.replace(
    'return res.status(400).json({ success: false, message: "API Failed and Could not safely fetch product page metadata." });',
    'return res.status(400).json({ success: false, message: "Could not fetch metadata from this URL. Please enter details manually." });'
)

# And in case there's another occurrence or slightly different format:
with open("server.ts", "w") as f:
    f.write(content)

