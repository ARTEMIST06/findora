import re

with open("src/services/store.ts", "r") as f:
    content = f.read()

new_methods = """
  // --- DRAFTS ---
  async getDrafts(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'productDrafts'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching drafts:", e);
      return [];
    }
  }

  async getDraft(draftId: string): Promise<any | null> {
    if (typeof window === 'undefined') return null;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'productDrafts', draftId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
      console.error("Error fetching draft:", e);
      return null;
    }
  }

  async saveDraft(draft: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'productDrafts', draft.id), draft, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving draft:", e);
      return false;
    }
  }

  async deleteDraft(draftId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'productDrafts', draftId));
      return true;
    } catch (e) {
      console.error("Error deleting draft:", e);
      return false;
    }
  }

  // --- BRANDS ---
  async getBrands(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'brands'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching brands:", e);
      return [];
    }
  }

  async saveBrand(brand: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'brands', brand.id), brand, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving brand:", e);
      return false;
    }
  }

  // --- CATEGORIES ---
  async getCategories(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching categories:", e);
      return [];
    }
  }

  async saveCategory(category: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'categories', category.id), category, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving category:", e);
      return false;
    }
  }
"""

content = content.replace("class FindoraStore {", "class FindoraStore {" + new_methods)

with open("src/services/store.ts", "w") as f:
    f.write(content)
