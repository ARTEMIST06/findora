import re

with open('src/types/index.ts', 'r') as f:
    code = f.read()

new_types = """
export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  offerId: string;
  targetPrice: number;
  currency: string;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}
"""

if "export interface PriceAlert" not in code:
    code = code + new_types
    with open('src/types/index.ts', 'w') as f:
        f.write(code)
    print("Patched types with PriceAlert")
else:
    print("Already there")
