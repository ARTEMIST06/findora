import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

# Add getImportHistory and addImportHistory
history_funcs = """
  async getImportHistory(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'importHistory'), orderBy('importedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching import history:", e);
      return [];
    }
  }

  async addImportHistory(history: any): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'importHistory', history.id), history);
    } catch (e) {
      console.error("Error adding import history:", e);
    }
  }
"""

if "addImportHistory" not in code:
    code = code.replace("class StoreManager {", "class StoreManager {\n" + history_funcs)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done patching store")
