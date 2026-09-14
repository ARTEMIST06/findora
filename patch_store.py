import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

# Fix Products snapshot
old_prod_snap = """          onSnapshot(collection(db, 'products'), (snapshot) => {
            if (!snapshot.empty) {
              this.products = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
              notifyChange();
            }
          });"""
new_prod_snap = """          onSnapshot(collection(db, 'products'), (snapshot) => {
            this.products = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
            notifyChange();
          });"""
code = code.replace(old_prod_snap, new_prod_snap)

# Fix Offers snapshot
old_offer_snap = """          onSnapshot(collection(db, 'offers'), (snapshot) => {
            if (!snapshot.empty) {
              this.offers = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PriceOffer));
              notifyChange();
            }
          });"""
new_offer_snap = """          onSnapshot(collection(db, 'offers'), (snapshot) => {
            this.offers = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PriceOffer));
            notifyChange();
          });"""
code = code.replace(old_offer_snap, new_offer_snap)

# Fix Stores snapshot
old_store_snap = """          onSnapshot(collection(db, 'stores'), (snapshot) => {
            if (!snapshot.empty) {
              this.stores = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Store));
              notifyChange();
            }
          });"""
new_store_snap = """          onSnapshot(collection(db, 'stores'), (snapshot) => {
            if (!snapshot.empty) {
              this.stores = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Store));
            } else {
              // We keep the initial stores so the app doesn't break, or we can just empty it.
              this.stores = [];
            }
            notifyChange();
          });"""
code = code.replace(old_store_snap, new_store_snap)

with open('src/services/store.ts', 'w') as f:
    f.write(code)
    
