import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

old_logic = """            // Check Duplicates
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
            }"""

new_logic = """            // Check Duplicates
            let foundExistingOffer = false;
            
            if (pRow.existingProductId) {
               // We have an explicit productId from the imported CSV
               const existOff = existingOffers.find(o => o.storeId === merchantId && o.productId === pRow.existingProductId);
               if (existOff) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOff.id;
                 pRow.overallStatus = 'ready'; // ready for update
                 foundExistingOffer = true;
               } else {
                 pRow.duplicateStatus = 'duplicate_product'; // product exists, but no offer
                 pRow.overallStatus = 'ready';
               }
            } else if (pd.merchantProductId) {
               const existOff = existingOffers.find(o => o.storeId === merchantId && o.merchantProductId === pd.merchantProductId);
               if (existOff) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOff.id;
                 pRow.existingProductId = existOff.productId;
                 pRow.overallStatus = 'ready'; // ready for update
                 foundExistingOffer = true;
               }
            } else {
               const existOffUrl = existingOffers.find(o => o.storeId === merchantId && o.productUrl === productUrl);
               if (existOffUrl) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOffUrl.id;
                 pRow.existingProductId = existOffUrl.productId;
                 pRow.overallStatus = 'ready'; // ready for update
                 foundExistingOffer = true;
               }
            }

            if (!foundExistingOffer && !pRow.existingProductId && pRow.productData.name) {
               const existProd = existingProducts.find(p => p.name.toLowerCase() === (pRow.productData.name || '').toLowerCase());
               if (existProd) {
                 pRow.duplicateStatus = 'duplicate_product';
                 pRow.existingProductId = existProd.id;
                 pRow.overallStatus = 'ready';
               }
            }"""

if old_logic in code:
    code = code.replace(old_logic, new_logic)
    print("Found and replaced block")
else:
    print("Not found")

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

