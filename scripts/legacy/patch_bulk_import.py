import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

# 1. Update mapping
old_mapping = """        productData: {
          name: row.title || row.Title || '',
          brand: row.brand || row.Brand || '',
          category: row.category || row.Category || '',
          shortDescription: row.shortPitch || '',
          whyFindora: row.whyFindoraPickedIt || '',
          images: row.image ? [row.image] : [],
          published: row.published === 'true' || row.published === true || false,
          featured: row.featured === 'true' || row.featured === true || false,
        },
        offerData: {
          price: parseFloat(row.currentPrice || row.Price || 0) || 0,
          originalPrice: parseFloat(row.mrp || row.MRP || 0) || undefined,
          availability: (row.availability || 'in_stock') as any
        }"""

new_mapping = """        productData: {
          name: row.title || row.Title || '',
          brand: row.brand || row.Brand || '',
          category: row.category || row.Category || '',
          shortDescription: row.shortPitch || '',
          whyFindora: row.whyFindoraPickedIt || '',
          badge: row.badge || '',
          images: row.image ? [row.image] : [],
          published: row.published === 'true' || row.published === true || false,
          featured: row.featured === 'true' || row.featured === true || false,
        },
        offerData: {
          price: parseFloat(row.currentPrice || row.Price || 0) || 0,
          originalPrice: parseFloat(row.mrp || row.MRP || 0) || undefined,
          merchantProductId: row.merchantProductId || '',
          availability: (row.availability || 'in_stock') as any
        },
        existingProductId: row.productId || undefined"""

code = code.replace(old_mapping, new_mapping)


# 2. Add badge to the new product creation mapping
old_create = """          name: row.productData.name || 'Untitled',
          brand: row.productData.brand || 'Unknown',
          category: row.productData.category || 'electronics',
          shortDescription: row.productData.shortDescription || '',
          description: row.productData.description || '',
          images: row.productData.images || [],
          offers: [],
          tags: [],
          whyFindora: row.productData.whyFindora || '',
          createdAt: new Date().toISOString(),
          published: importAsDrafts ? false : (row.productData.published ?? true),"""

new_create = """          name: row.productData.name || 'Untitled',
          brand: row.productData.brand || 'Unknown',
          category: row.productData.category || 'electronics',
          shortDescription: row.productData.shortDescription || '',
          description: row.productData.description || '',
          images: row.productData.images || [],
          badge: row.productData.badge || '',
          offers: [],
          tags: [],
          whyFindora: row.productData.whyFindora || '',
          createdAt: new Date().toISOString(),
          published: importAsDrafts ? false : (row.productData.published ?? true),"""

code = code.replace(old_create, new_create)

# 3. Add badge updating logic for existing product
old_update = """            await store.updateProduct(row.existingProductId, {
              name: row.productData.name,
              brand: row.productData.brand,
              category: row.productData.category,
              shortDescription: row.productData.shortDescription,
              whyFindora: row.productData.whyFindora,
              published: importAsDrafts ? false : row.productData.published,
              featured: row.productData.featured
            });"""
            
new_update = """            await store.updateProduct(row.existingProductId, {
              name: row.productData.name,
              brand: row.productData.brand,
              category: row.productData.category,
              shortDescription: row.productData.shortDescription,
              whyFindora: row.productData.whyFindora,
              badge: row.productData.badge,
              published: importAsDrafts ? false : row.productData.published,
              featured: row.productData.featured
            });"""

code = code.replace(old_update, new_update)

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

print("Patched mapping")
