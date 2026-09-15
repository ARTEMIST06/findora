import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

alert_methods = """
  // --- PRICE ALERTS ---
  async getPriceAlerts(userId: string): Promise<PriceAlert[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'priceAlerts'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as PriceAlert);
    } catch (e) {
      console.error("Error fetching price alerts:", e);
      return [];
    }
  }

  async addPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<PriceAlert | undefined> {
    if (typeof window === 'undefined') return undefined;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const now = new Date().toISOString();
      const newAlert: PriceAlert = {
        ...alert,
        id: `alert-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      
      await setDoc(doc(db, 'priceAlerts', newAlert.id), newAlert);
      return newAlert;
    } catch (e) {
      console.error("Error adding price alert:", e);
      return undefined;
    }
  }

  async updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const updatePayload = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'priceAlerts', id), updatePayload);
      return true;
    } catch (e) {
      console.error("Error updating price alert:", e);
      return false;
    }
  }

  async deletePriceAlert(id: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      await deleteDoc(doc(db, 'priceAlerts', id));
      return true;
    } catch (e) {
      console.error("Error deleting price alert:", e);
      return false;
    }
  }
"""

if "// --- PRICE ALERTS ---" not in code:
    code = code.replace("export const findoraStore = new FindoraStore();", alert_methods + "\nexport const findoraStore = new FindoraStore();")
    with open('src/services/store.ts', 'w') as f:
        f.write(code)
    print("Added alert methods")
else:
    print("Already added")
