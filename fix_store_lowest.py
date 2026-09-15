import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

replacement = """
  getAllProductsWithPrices(publishedOnly = true): ProductWithPrices[] {
    let prods = publishedOnly ? this.products.filter(p => p.published) : this.products;
    
    return prods.map(p => {
      const pOffers = this.offers.filter(o => o.productId === p.id);
      
      // Filter out invalid/unavailable offers
      const validOffers = pOffers.filter(o => 
         o.availability === 'in_stock' || o.availability === 'pre_order' || o.availability === 'limited_stock'
      ).filter(o => o.price != null && o.price > 0);

      const prices = validOffers.map(o => o.price);
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : undefined;
      const highestPrice = prices.length > 0 ? Math.max(...prices) : undefined;
      
      const bestOffer = lowestPrice !== undefined ? validOffers.find(o => o.price === lowestPrice) : undefined;
      const bestStore = bestOffer ? this.stores.find(s => s.id === bestOffer.storeId) : undefined;
      
      let maxDiscountPercent = 0;
      validOffers.forEach(o => {
        if (o.originalPrice && o.originalPrice > o.price) {
          const discount = Math.round(((o.originalPrice - o.price) / o.originalPrice) * 100);
          if (discount > maxDiscountPercent) maxDiscountPercent = discount;
        }
      });

      return {
        ...p,
        offers: pOffers,
        lowestPrice,
        highestPrice,
        maxDiscountPercent,
        bestStore
      };
    });
  }
"""

code = re.sub(
    r'\s*getAllProductsWithPrices\(publishedOnly = true\): ProductWithPrices\[\] \{[\s\S]*?return \{[\s\S]*?bestStore\s*\};\s*\}\);\s*\}', 
    replacement.strip(), 
    code
)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done store lowest")
