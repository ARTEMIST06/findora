import re

with open('src/types/index.ts', 'r') as f:
    code = f.read()

# Add to Store:
# fetchProvider?: string;
# syncSupported?: boolean;
code = code.replace("  active?: boolean;\n  color?: string;", "  active?: boolean;\n  color?: string;\n  fetchProvider?: string;\n  syncSupported?: boolean;")

# Add to PriceOffer:
# merchantProductId?: string;
# productUrl?: string;
# syncStatus?: 'manual' | 'automatic' | 'error' | 'unavailable';
# syncError?: string;
# lastSyncedAt?: string;

code = code.replace("  shippingNote?: string;\n}", "  shippingNote?: string;\n  merchantProductId?: string;\n  productUrl?: string;\n  syncStatus?: 'manual' | 'automatic' | 'error' | 'unavailable';\n  syncError?: string;\n  lastSyncedAt?: string;\n}")

with open('src/types/index.ts', 'w') as f:
    f.write(code)

print("done types")
