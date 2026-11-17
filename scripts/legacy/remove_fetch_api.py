import re

with open("server.ts", "r") as f:
    content = f.read()

# Remove fetchProductLimiter definition
content = re.sub(r'const fetchProductLimiter = rateLimit\(\{[\s\S]*?\}\);\s*', '', content)

# Remove safeExtractMetadata function
content = re.sub(r'async function safeExtractMetadata\([\s\S]*?return \{\s*title,\s*image,\s*brand,\s*isMetadataFallback:\s*true\s*\};\s*\}\s*', '', content)

# Remove extractASIN function
content = re.sub(r'function extractASIN\([\s\S]*?return null;\s*\}\s*', '', content)

# Remove the entire app.post("/api/fetch-product", ...) block
# We have to be careful with regex for a large block. 
# Better to use string manipulation to find start and matching end brace.
start_idx = content.find('app.post("/api/fetch-product",')
if start_idx != -1:
    # Find matching brace
    brace_count = 0
    in_string = False
    string_char = None
    end_idx = -1
    for i in range(start_idx, len(content)):
        char = content[i]
        if in_string:
            if char == string_char and content[i-1] != '\\':
                in_string = False
        else:
            if char in ("'", '"', "`"):
                in_string = True
                string_char = char
            elif char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    # include trailing `);`
                    if content[end_idx:end_idx+2] == ');':
                        end_idx += 2
                    break
    
    if end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

with open("server.ts", "w") as f:
    f.write(content)

