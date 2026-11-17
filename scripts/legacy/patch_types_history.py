import re

with open('src/types/index.ts', 'r') as f:
    code = f.read()

# Add new interfaces
new_interfaces = """
export interface PriceHistory {
  id: string;
  productId: string;
  offerId: string;
  merchantId: string;
  price: number;
  mrp?: number;
  availability: string;
  source: 'api' | 'manual' | 'import';
  recordedAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  offerId?: string;
  targetPrice: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
"""

if "export interface PriceHistory" not in code:
    code += "\n" + new_interfaces

# Add priceDrop to PriceOffer
if "priceDrop?:" not in code:
    # find PriceOffer
    offer_match = re.search(r'export interface PriceOffer \{.*?\n\}', code, re.DOTALL)
    if offer_match:
        offer_str = offer_match.group(0)
        new_offer_str = offer_str.replace(
            "lastSyncedAt?: string;", 
            "lastSyncedAt?: string;\n  priceDrop?: {\n    amount: number;\n    percentage: number;\n    previousPrice: number;\n    detectedAt: string;\n  };"
        )
        code = code.replace(offer_str, new_offer_str)

with open('src/types/index.ts', 'w') as f:
    f.write(code)

print("done patching types for price history")
