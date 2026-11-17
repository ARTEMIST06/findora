import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

# Replace toggleWishlist
replacement = """
  toggleWishlist(productId: string): boolean {
    if (!this.currentUser) {
      return false;
    }
    if (this.wishlist.includes(productId)) {
      this.wishlist = this.wishlist.filter((id) => id !== productId);
    } else {
      this.wishlist.push(productId);
    }
    
    // Save to Firebase
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'wishlists', this.currentUser!.id), {
            productIds: this.wishlist
          }, { merge: true }).catch(console.error);
        });
      });
    }
    
    notifyChange();
    return this.isInWishlist(productId);
  }
"""

pattern = r'\s*toggleWishlist\(productId: string\): boolean \{[\s\S]*?return this\.isInWishlist\(productId\);\n\s*\}'
code = re.sub(pattern, replacement, code)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done store")
