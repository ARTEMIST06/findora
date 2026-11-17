import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

replacement = """    this.compareIds = getFromStorage(STORAGE_KEYS.COMPARE, []);
    this.wishlist = [];
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);"""

code = code.replace("    this.compareIds = getFromStorage(STORAGE_KEYS.COMPARE, []);\n    this.wishlist = getFromStorage(STORAGE_KEYS.WISHLIST, []);", replacement)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done init wishlist")
