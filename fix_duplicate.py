import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

replacement = """
      const res = await provider.fetchProduct(fetchUrl);
      
      let duplicateProduct: any = null;
      if (res.merchantProductId) {
        const offers = store.getOffers();
        const existingOffer = offers.find(o => o.storeId === fetchMerchantId && o.merchantProductId === res.merchantProductId);
        if (existingOffer) {
           const allProds = store.getAllProductsWithPrices(false);
           duplicateProduct = allProds.find(p => p.id === existingOffer.productId);
        }
      }

      if (duplicateProduct) {
         setFetchResult({ success: false, message: `This merchant product may already exist as "${duplicateProduct.name}". Continue anyway or edit existing.` });
      } else if (res.error) {
"""
code = code.replace("const res = await provider.fetchProduct(fetchUrl);\n      if (res.error) {", replacement.strip())

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done duplicate")
