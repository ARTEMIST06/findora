with open("src/services/store.ts", "r") as f:
    content = f.read()

content = content.replace("async getCategories(): Promise<any[]> {", "async fetchCategories(): Promise<any[]> {")

with open("src/services/store.ts", "w") as f:
    f.write(content)
