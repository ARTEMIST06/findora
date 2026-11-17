import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

# Make addProduct async
code = code.replace(
    "addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {",
    "async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {"
)
code = code.replace(
    """    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'products', newProduct.id), newProduct).catch(console.error);
        });
      });
    }""",
    """    if (typeof window !== 'undefined') {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
    }"""
)

# Make updateProduct async
code = code.replace(
    "updateProduct(id: string, updates: Partial<Product>): Product | undefined {",
    "async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {"
)
code = code.replace(
    """    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          updateDoc(doc(db, 'products', id), { ...updates, updatedAt: newProduct.updatedAt }).catch(console.error);
        });
      });
    }""",
    """    if (typeof window !== 'undefined') {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'products', id), { ...updates, updatedAt: newProduct.updatedAt });
    }"""
)

# Make addPriceOffer async
code = code.replace(
    "addPriceOffer(offer: Omit<PriceOffer, 'id' | 'lastUpdated'>): PriceOffer {",
    "async addPriceOffer(offer: Omit<PriceOffer, 'id' | 'lastUpdated'>): Promise<PriceOffer> {"
)
code = code.replace(
    """    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'offers', newOffer.id), newOffer).catch(console.error);
        });
      });
    }""",
    """    if (typeof window !== 'undefined') {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'offers', newOffer.id), newOffer);
    }"""
)

# Make updatePriceOffer async
code = code.replace(
    "updatePriceOffer(id: string, updates: Partial<PriceOffer>): PriceOffer | undefined {",
    "async updatePriceOffer(id: string, updates: Partial<PriceOffer>): Promise<PriceOffer | undefined> {"
)
code = code.replace(
    """    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          updateDoc(doc(db, 'offers', id), { ...updates, lastUpdated: newOffer.lastUpdated }).catch(console.error);
        });
      });
    }""",
    """    if (typeof window !== 'undefined') {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'offers', id), { ...updates, lastUpdated: newOffer.lastUpdated });
    }"""
)

with open('src/services/store.ts', 'w') as f:
    f.write(code)
print("done")
