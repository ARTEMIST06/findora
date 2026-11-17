import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

replacement_logout = """
              this.currentUser = null;
              this.wishlist = [];
              localStorage.removeItem(STORAGE_KEYS.WISHLIST);
              if (unsubscribeWishlist) {
"""

code = code.replace("""              this.currentUser = null;
              this.wishlist = getFromStorage(STORAGE_KEYS.WISHLIST, []);
              if (unsubscribeWishlist) {""", replacement_logout)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done logout fix")
