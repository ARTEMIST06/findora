with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "          ) : (" in line:
        new_lines.append(line)
        skip = True
        continue
    if skip and '<div className="overflow-x-auto">' in line:
        skip = False
        new_lines.append(line)
        continue
    if not skip:
        new_lines.append(line)

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.writelines(new_lines)
