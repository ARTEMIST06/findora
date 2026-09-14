import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

replacement = """
          // Stores listener
          onSnapshot(collection(db, 'stores'), (snapshot) => {
            if (!snapshot.empty) {
              this.stores = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Store));
            } else {
              // If empty, auto-seed Amazon so they can at least add Amazon offers
              const amazon = INITIAL_STORES.find(s => s.id === 'store-amazon');
              if (amazon) {
                setDoc(doc(db, 'stores', amazon.id), amazon).catch(console.error);
                this.stores = [amazon];
              }
            }
            notifyChange();
          });
"""
code = re.sub(r'// Stores listener.*?notifyChange\(\);\n          \}\);', replacement.strip(), code, flags=re.DOTALL)

with open('src/services/store.ts', 'w') as f:
    f.write(code)
print("done")
