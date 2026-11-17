import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

# The class ends with:
#     this.init();
#     notifyChange();
#   }
# }
# 
#   // --- PRICE ALERTS ---

# We need to move the `}` that closes the class to *after* the new methods.

old_end = """    this.init();
    notifyChange();
  }
}

  // --- PRICE ALERTS ---"""

new_end = """    this.init();
    notifyChange();
  }

  // --- PRICE ALERTS ---"""

code = code.replace(old_end, new_end)

# and add a `}` before `export const findoraStore`

old_export = """export const findoraStore = new FindoraStore();"""
new_export = """}

export const findoraStore = new FindoraStore();"""

code = code.replace(old_export, new_export)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("Fixed store.ts class brackets")

