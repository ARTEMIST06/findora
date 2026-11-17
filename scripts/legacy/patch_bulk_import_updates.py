import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

# 1. Update duplicate detection
old_duplicate = """            if (row.existingProductId) {
               const existOff = existingOffers.find(o => o.storeId === merchantId && o.productId === row.existingProductId);
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

new_duplicate = """            if (row.productId) {
               pRow.existingProductId = row.productId;
               const existOff = existingOffers.find(o => o.storeId === merchantId && o.productId === row.productId);
               if (existOff) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOff.id;
                 pRow.overallStatus = 'ready'; // we can just update it
                 foundExistingOffer = true;
               } else {
                 pRow.duplicateStatus = 'duplicate_product';
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
               }
            }"""

if old_duplicate in code:
    code = code.replace(old_duplicate, new_duplicate)
else:
    print("duplicate detection not found, regex instead")
    code = re.sub(r'if \(row\.existingProductId\) \{[\s\S]*?if \(!foundExistingOffer && pRow\.productData\.name\) \{[\s\S]*?\}', new_duplicate, code)


# 2. Update import logic
old_handle_import = """    const rowsToProcess = processedRows.filter(r => r.validationStatus === 'valid' && r.duplicateStatus !== 'duplicate_offer');
    
    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      try {
        const productInput = {
          name: row.productData.name || 'Untitled',
          brand: row.productData.brand || 'Unknown',
          category: row.productData.category || 'electronics',
          shortDescription: row.productData.shortDescription || '',
          description: row.productData.description || '',
          images: row.productData.images || [],
          specifications: {},
          pros: [],
          cons: [],
          whyFindora: row.productData.whyFindora || '',
          tags: [],
          published: importAsDrafts ? false : (row.productData.published ?? true),
          featured: row.productData.featured ?? false,
          slug: (row.productData.name || 'Untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4)
        };

        let productIdToUse = row.existingProductId;
        if (!productIdToUse) {
           const newProduct = await store.addProduct(productInput);
           productIdToUse = newProduct.id;
        }
        
        await store.addPriceOffer({
          productId: productIdToUse,
          storeId: row.merchantId,
          price: row.offerData.price || 0,
          originalPrice: row.offerData.originalPrice,
          currency: 'INR',
          affiliateUrl: row.affiliateUrl,
          availability: row.offerData.availability || 'in_stock',
          sourceType: 'import',
          merchantProductId: row.offerData.merchantProductId,
          productUrl: row.productUrl,
          syncStatus: row.autoFetchStatus === 'success' ? 'automatic' : 'manual'
        });
        imported++;
        row.overallStatus = 'imported';"""

new_handle_import = """    const rowsToProcess = processedRows.filter(r => r.validationStatus === 'valid' && r.overallStatus !== 'error' && r.overallStatus !== 'invalid');
    
    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      try {
        let productIdToUse = row.existingProductId;
        
        const updateProductInput = {
          name: row.productData.name,
          brand: row.productData.brand,
          category: row.productData.category,
          shortDescription: row.productData.shortDescription,
          badge: row.productData.badge,
          whyFindora: row.productData.whyFindora,
          published: importAsDrafts ? false : row.productData.published,
          featured: row.productData.featured,
        };
        
        if (row.productData.images && row.productData.images.length > 0) {
           (updateProductInput as any).images = row.productData.images;
        }

        if (productIdToUse) {
           await store.updateProduct(productIdToUse, updateProductInput);
        } else {
           const productInput = {
             ...updateProductInput,
             name: row.productData.name || 'Untitled',
             description: row.productData.description || '',
             specifications: {},
             pros: [],
             cons: [],
             tags: [],
             slug: (row.productData.name || 'Untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4)
           };
           const newProduct = await store.addProduct(productInput as any);
           productIdToUse = newProduct.id;
        }
        
        if (row.existingOfferId) {
            await store.updateOffer(row.existingOfferId, {
              price: row.offerData.price,
              originalPrice: row.offerData.originalPrice,
              affiliateUrl: row.affiliateUrl,
              availability: row.offerData.availability,
              merchantProductId: row.offerData.merchantProductId,
              productUrl: row.productUrl,
              syncStatus: row.autoFetchStatus === 'success' ? 'automatic' : 'manual'
            });
        } else {
            await store.addPriceOffer({
              productId: productIdToUse!,
              storeId: row.merchantId,
              price: row.offerData.price || 0,
              originalPrice: row.offerData.originalPrice,
              currency: 'INR',
              affiliateUrl: row.affiliateUrl,
              availability: row.offerData.availability || 'in_stock',
              sourceType: 'import',
              merchantProductId: row.offerData.merchantProductId,
              productUrl: row.productUrl,
              syncStatus: row.autoFetchStatus === 'success' ? 'automatic' : 'manual'
            });
        }
        imported++;
        row.overallStatus = 'imported';"""

code = code.replace(old_handle_import, new_handle_import)

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

print("Patched handleImport updates")
