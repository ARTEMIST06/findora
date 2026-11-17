import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

replacement = """
  getProductWithPrices(idOrSlug: string): ProductWithPrices | undefined {
    const product = this.getProductBySlug(idOrSlug) || this.getProductById(idOrSlug);
    if (!product) return undefined;

    const allOffers = this.offers.filter((o) => o.productId === product.id);

    // Filter valid offers
    const productOffers = allOffers
      .filter((o) => o.availability === 'in_stock' || o.availability === 'pre_order' || o.availability === 'limited_stock')
      .filter(o => o.price != null && o.price > 0)
      .sort((a, b) => a.price - b.price);

    const lowestPrice = productOffers.length > 0 ? productOffers[0].price : undefined;
    const highestPrice = productOffers.length > 0 ? productOffers[productOffers.length - 1].price : undefined;
    
    let maxDiscountPercent = 0;
    productOffers.forEach((offer) => {
      if (offer.originalPrice && offer.originalPrice > offer.price) {
        const disc = Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100);
        if (disc > maxDiscountPercent) maxDiscountPercent = disc;
      }
    });

    const bestStore = productOffers.length > 0
      ? this.stores.find((s) => s.id === productOffers[0].storeId)
      : undefined;

    return {
      ...product,
      offers: allOffers, // Return all offers including out of stock
      lowestPrice,
      highestPrice,
      maxDiscountPercent: maxDiscountPercent > 0 ? maxDiscountPercent : undefined,
      bestStore,
    };
  }
"""

code = re.sub(
    r'\s*getProductWithPrices\(idOrSlug: string\): ProductWithPrices \| undefined \{[\s\S]*?return \{[\s\S]*?bestStore,\s*\};\s*\}', 
    replacement.strip(), 
    code
)

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done getProductWithPrices")
