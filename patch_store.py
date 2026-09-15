import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

delete_account_logic = """
  async deleteAccount(): Promise<{ success: boolean; message: string; requiresReauth?: boolean }> {
    if (!this.currentUser || typeof window === 'undefined') return { success: false, message: 'Not logged in' };
    
    try {
      const { auth, db } = await import('../lib/firebase');
      const { deleteUser, getIdToken } = await import('firebase/auth');
      const { collection, query, where, getDocs, deleteDoc, doc, writeBatch } = await import('firebase/firestore');
      
      const user = auth.currentUser;
      if (!user) return { success: false, message: 'Authentication session lost' };

      const uid = user.uid;
      
      // 1. Delete price alerts (Client allowed by rules)
      try {
        const alertsQuery = query(collection(db, 'priceAlerts'), where('userId', '==', uid));
        const alertsSnapshot = await getDocs(alertsQuery);
        const batch = writeBatch(db);
        alertsSnapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.error("Failed to delete price alerts:", e);
      }
      
      // 2. Delete wishlist (Client allowed by rules)
      try {
        await deleteDoc(doc(db, 'wishlists', uid));
      } catch (e) {
        console.error("Failed to delete wishlist:", e);
      }

      // 3. Trigger backend cleanup for immutable data (users profile and securityEvents)
      try {
        const idToken = await getIdToken(user, true);
        await fetch('/api/delete-account-cleanup', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
      } catch (e) {
        console.error("Backend cleanup failed, continuing to auth deletion", e);
      }

      // 4. Finally, delete the Auth account itself
      try {
        await deleteUser(user);
        this.currentUser = null;
        notifyChange();
        return { success: true, message: 'Account deleted successfully' };
      } catch (e: any) {
        if (e.code === 'auth/requires-recent-login') {
          return { success: false, message: 'Please re-authenticate to confirm deletion.', requiresReauth: true };
        }
        throw e;
      }
      
    } catch (e: any) {
      console.error("Delete Account Error:", e);
      return { success: false, message: e.message || 'Failed to delete account' };
    }
  }
"""

if "deleteAccount()" not in code:
    code = code.replace("logout(): void {", delete_account_logic + "\n  logout(): void {")
    with open('src/services/store.ts', 'w') as f:
        f.write(code)
    print("Patched store.ts with deleteAccount")
else:
    print("Already patched")
