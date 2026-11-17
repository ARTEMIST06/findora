import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

replacement = """
      this.wishlist = this.wishlist.filter((pid) => pid !== id);
      this.compareIds = this.compareIds.filter((pid) => pid !== id);
      saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
      saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
      saveToStorage(STORAGE_KEYS.COMPARE, this.compareIds);
      if (this.currentUser && typeof window !== 'undefined') {
        import('../lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            setDoc(doc(db, 'wishlists', this.currentUser!.id), {
              productIds: this.wishlist
            }, { merge: true }).catch(console.error);
          });
        });
      }
"""

code = code.replace("""      this.wishlist = this.wishlist.filter((pid) => pid !== id);
      this.compareIds = this.compareIds.filter((pid) => pid !== id);
      saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
      saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
      saveToStorage(STORAGE_KEYS.WISHLIST, this.wishlist);
      saveToStorage(STORAGE_KEYS.COMPARE, this.compareIds);""", replacement)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done delete product fix")
