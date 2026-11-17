import re

with open('src/types/index.ts', 'r') as f:
    code = f.read()

new_types = """
export interface PriceHistory {
  id: string;
  productId: string;
  offerId: string;
  merchantId: string;
  price: number;
  mrp?: number;
  availability: OfferAvailability;
  recordedAt: string;
  source: OfferSourceType;
  createdAt: string;
}
"""

if "export interface PriceHistory" not in code:
    code = code + new_types
    with open('src/types/index.ts', 'w') as f:
        f.write(code)
    print("Patched types")
else:
    print("Already there")
