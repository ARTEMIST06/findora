import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

# First, in processRows, find if product exists by title
duplicate_logic_old = """
            // Check Duplicates
            if (pd.merchantProductId) {
               const existOff = existingOffers.find(o => o.storeId === merchantId && o.merchantProductId === pd.merchantProductId);
               if (existOff) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOff.id;
                 pRow.existingProductId = existOff.productId;
                 pRow.overallStatus = 'needs_review';
               }
            } else {
               const existOffUrl = existingOffers.find(o => o.storeId === merchantId && o.productUrl === productUrl);
               if (existOffUrl) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOffUrl.id;
                 pRow.existingProductId = existOffUrl.productId;
                 pRow.overallStatus = 'needs_review';
               }
            }
"""

duplicate_logic_new = """
            // Check Duplicates
            let foundExistingOffer = false;
            if (pd.merchantProductId) {
               const existOff = existingOffers.find(o => o.storeId === merchantId && o.merchantProductId === pd.merchantProductId);
               if (existOff) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOff.id;
                 pRow.existingProductId = existOff.productId;
                 pRow.overallStatus = 'needs_review';
                 foundExistingOffer = true;
               }
            } else {
               const existOffUrl = existingOffers.find(o => o.storeId === merchantId && o.productUrl === productUrl);
               if (existOffUrl) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOffUrl.id;
                 pRow.existingProductId = existOffUrl.productId;
                 pRow.overallStatus = 'needs_review';
                 foundExistingOffer = true;
               }
            }

            if (!foundExistingOffer && pRow.productData.name) {
               const existProd = existingProducts.find(p => p.name.toLowerCase() === (pRow.productData.name || '').toLowerCase());
               if (existProd) {
                 pRow.duplicateStatus = 'duplicate_product';
                 pRow.existingProductId = existProd.id;
               }
            }
"""
code = code.replace(duplicate_logic_old.strip(), duplicate_logic_new.strip())


# Second, in handleImport, if duplicate_product, use it
import_logic_old = """
        const newProduct = await store.addProduct(productInput);
        
        await store.addPriceOffer({
          productId: newProduct.id,
"""

import_logic_new = """
        let productIdToUse = row.existingProductId;
        if (!productIdToUse) {
           const newProduct = await store.addProduct(productInput);
           productIdToUse = newProduct.id;
        }
        
        await store.addPriceOffer({
          productId: productIdToUse,
"""
code = code.replace(import_logic_old.strip(), import_logic_new.strip())

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

print("done patching duplicates")
