import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Add fetchedFields state
if 'const [fetchedFields' not in code:
    code = code.replace(
        "const [fetchResult, setFetchResult] = useState<{success?: boolean; message?: string} | null>(null);",
        "const [fetchResult, setFetchResult] = useState<{success?: boolean; message?: string} | null>(null);\n  const [fetchedFields, setFetchedFields] = useState<Record<string, boolean>>({});"
    )

# Reset state on Add Product
add_product_replacement = """
  const handleAddProduct = () => {
    setEditingProduct({
      name: '', brand: '', category: categories[0]?.slug || '',
      shortDescription: '', description: '', images: [], tags: [], published: false, featured: false,
      specifications: {}, pros: [], cons: [], whyFindora: ''
    });
    setEditingProductOffers([{ storeId: stores[0]?.id || '', price: 0, originalPrice: 0, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' }]);
    setFetchMerchantId(stores[0]?.id || '');
    setFetchUrl('');
    setFetchResult(null);
    setFetchedFields({});
    setIsProductModalOpen(true);
  };
"""
code = re.sub(r'const handleAddProduct = \(\) => \{[\s\S]*?setIsProductModalOpen\(true\);\n\s*\};', add_product_replacement.strip(), code)

# handleFetchProduct replacement
new_fetch = """
  const handleFetchProduct = async () => {
    if (!fetchMerchantId || !fetchUrl) return;
    setIsFetching(true);
    setFetchResult(null);
    setFetchedFields({});
    try {
      const res = await fetch('/api/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl, merchantId: fetchMerchantId })
      });
      const data = await res.json();
      
      if (!data.success) {
        setFetchResult({ success: false, message: data.message || 'Error fetching product' });
        return;
      }
      
      const resData = data.product;

      let duplicateProduct: any = null;
      if (resData.merchantProductId) {
        const offers = store.getOffers();
        const existingOffer = offers.find(o => o.storeId === fetchMerchantId && o.merchantProductId === resData.merchantProductId);
        if (existingOffer) {
           const allProds = store.getAllProductsWithPrices(false);
           duplicateProduct = allProds.find(p => p.id === existingOffer.productId);
        }
      }

      if (duplicateProduct) {
         setFetchResult({ success: false, message: `This merchant product may already exist as "${duplicateProduct.name}". Continue anyway or edit existing.` });
      } else {
        // Populate form
        setEditingProduct({
          ...editingProduct,
          name: resData.title || editingProduct?.name || '',
          brand: resData.brand || editingProduct?.brand || '',
          category: resData.category || editingProduct?.category || categories[0]?.slug,
          images: resData.images?.length ? resData.images : (editingProduct?.images || []),
        });
        
        // Update first offer
        const newOffers = [...editingProductOffers];
        if (newOffers.length > 0) {
            newOffers[0] = {
                ...newOffers[0],
                storeId: fetchMerchantId,
                price: resData.currentPrice !== undefined ? resData.currentPrice : newOffers[0].price,
                originalPrice: resData.mrp || newOffers[0].originalPrice,
                availability: resData.availability || newOffers[0].availability,
                productUrl: resData.productUrl || fetchUrl,
                merchantProductId: resData.merchantProductId || newOffers[0].merchantProductId,
                syncStatus: 'manual'
            };
            setEditingProductOffers(newOffers);
        }
        
        setFetchedFields({
           name: !!resData.title,
           brand: !!resData.brand,
           category: !!resData.category,
           images: !!(resData.images?.length),
           price: resData.currentPrice !== undefined && resData.currentPrice !== null,
           originalPrice: !!resData.mrp,
           availability: !!resData.availability,
           merchantProductId: !!resData.merchantProductId,
           productUrl: !!resData.productUrl,
        });

        setFetchResult({ success: true, message: 'Product information fetched automatically.' });
      }
    } catch (e: any) {
      setFetchResult({ success: false, message: e.message || 'Error fetching product' });
    } finally {
      setIsFetching(false);
    }
  };
"""
code = re.sub(r'const handleFetchProduct = async \(\) => \{[\s\S]*?\} finally \{\s*setIsFetching\(false\);\s*\}\s*\};', new_fetch.strip(), code)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done patch_fetch")
