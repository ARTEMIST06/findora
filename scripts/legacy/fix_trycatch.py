import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

replacement = """
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct.brand) {
      showToast('Please provide a product title and brand', 'error');
      return;
    }
    
    // Validate offers if published
    const validOffers = editingProductOffers.filter(o => o.storeId && o.price && o.price > 0 && o.affiliateUrl);
    if ((editingProduct.published ?? true) && validOffers.length === 0) {
      showToast('You must add at least one valid store offer to publish this product.', 'error');
      return;
    }

    try {
      const slug =
        editingProduct.slug ||
        editingProduct.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      let savedProductId = editingProduct.id;

      if (editingProduct.id) {
        // Update
        await store.updateProduct(editingProduct.id, {
          ...editingProduct,
          slug,
        });
        showToast(`Updated "${editingProduct.name}"`, 'success');
      } else {
        // Add
        const newProd = await store.addProduct({
          ...editingProduct,
          slug,
          rating: editingProduct.rating || 4.5,
          reviewCount: editingProduct.reviewCount || 10,
          published: editingProduct.published ?? true,
          featured: editingProduct.featured ?? false,
        } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        savedProductId = newProd.id;
        showToast(`Added new product "${editingProduct.name}"`, 'success');
      }

      // Save offers
      if (savedProductId) {
        for (const offer of editingProductOffers) {
          if (!offer.storeId || !offer.price || offer.price <= 0 || !offer.affiliateUrl) continue; // Skip invalid
          
          if (offer.id) {
            await store.updatePriceOffer(offer.id, {
              ...offer,
              productId: savedProductId,
              price: Number(offer.price),
              originalPrice: offer.originalPrice ? Number(offer.originalPrice) : undefined
            });
          } else {
            await store.addPriceOffer({
              productId: savedProductId,
              storeId: offer.storeId,
              price: Number(offer.price),
              originalPrice: offer.originalPrice ? Number(offer.originalPrice) : undefined,
              currency: offer.currency || 'INR',
              affiliateUrl: offer.affiliateUrl,
              availability: offer.availability || 'in_stock',
              sourceType: offer.sourceType || 'manual'
            } as Omit<PriceOffer, 'id' | 'lastUpdated'>);
          }
        }
      }

      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving product and offers.', 'error');
    }
  };
"""

code = re.sub(r'const handleSaveProduct = async \(e: React\.FormEvent\) => \{.*?\n  \};', replacement.strip(), code, flags=re.DOTALL)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)
print("done")
