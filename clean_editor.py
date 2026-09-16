import re

with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

# Remove state variables
content = re.sub(r'const \[isFetchingInfo, setIsFetchingInfo\] = useState\(false\);\n\s*', '', content)

# Remove handleFetchInfo function block
start_idx = content.find('const handleFetchInfo = async () => {')
if start_idx != -1:
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
                    if content[end_idx:end_idx+1] == ';':
                        end_idx += 1
                    break
    if end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

# Remove UI button
content = re.sub(r'<button onClick=\{handleFetchInfo\}.*?Fetch Product Info\s*</button>\n\s*', '', content, flags=re.DOTALL)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)

