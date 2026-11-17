import re

# 1. FIX TYPES
with open('src/types/index.ts', 'r') as f:
    types_code = f.read()

types_code = types_code.replace(
    "export type OfferSourceType = 'api' | 'manual' | 'extension';",
    "export type OfferSourceType = 'api' | 'manual' | 'extension' | 'import';"
)

with open('src/types/index.ts', 'w') as f:
    f.write(types_code)

# 2. FIX STORE
with open('src/services/store.ts', 'r') as f:
    store_code = f.read()

old_get_price_history = """  getPriceHistory(productId: string) {
    return INITIAL_PRICE_HISTORY[productId] || [
      { date: 'Jul 2026', price: 99999, storeName: 'Store' },
      { date: 'Aug 2026', price: 95999, storeName: 'Store' },
      { date: 'Sep 2026', price: 92999, storeName: 'Store' },
    ];
  }"""

new_history_methods = """  async getPriceHistory(productId: string): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'priceHistory'), where('productId', '==', productId), orderBy('recordedAt', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching price history:", e);
      return [];
    }
  }

  async addPriceHistory(history: any): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'priceHistory', history.id), history);
    } catch (e) {
      console.error("Error adding price history:", e);
    }
  }"""

store_code = store_code.replace(old_get_price_history.strip(), new_history_methods.strip())

with open('src/services/store.ts', 'w') as f:
    f.write(store_code)

print("done fixing types and store")
