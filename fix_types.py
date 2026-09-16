import re

with open("src/types/index.ts", "r") as f:
    content = f.read()

content = content.replace("export interface ProductDraft {\n  id: string;", "export interface ProductDraft {\n  id: string;\n  draftStatus?: 'incomplete' | 'in_progress' | 'almost_ready' | 'ready_to_publish' | 'published';")

with open("src/types/index.ts", "w") as f:
    f.write(content)
