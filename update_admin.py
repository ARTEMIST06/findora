import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# 1. Imports
if 'import { getProviderById }' not in code:
    code = code.replace("import { formatINR", "import { getProviderById } from '../../services/merchants/providerFactory';\nimport { formatINR")

# 2. State
state_injection = """
  // Product Fetch State
  const [fetchMerchantId, setFetchMerchantId] = useState('');
  const [fetchUrl, setFetchUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{success?: boolean; message?: string} | null>(null);

  const handleFetchProduct = async () => {
    if (!fetchMerchantId || !fetchUrl) return;
    setIsFetching(true);
    setFetchResult(null);
    try {
      const provider = getProviderById(fetchMerchantId);
      if (!provider) throw new Error('Provider not found');
      
      const res = await provider.fetchProduct(fetchUrl);
      if (res.error) {
        setFetchResult({ success: false, message: res.error });
      } else {
        // Populate form
        setEditingProduct({
          ...editingProduct,
          name: res.title || editingProduct?.name || '',
          brand: res.brand || editingProduct?.brand || '',
          category: res.category || editingProduct?.category || categories[0]?.slug,
          images: res.images?.length ? res.images : (editingProduct?.images || []),
        });
        
        // Update first offer
        const newOffers = [...editingProductOffers];
        if (newOffers.length > 0) {
            newOffers[0] = {
                ...newOffers[0],
                storeId: fetchMerchantId,
                price: res.currentPrice || newOffers[0].price,
                originalPrice: res.mrp || newOffers[0].originalPrice,
                availability: res.availability || newOffers[0].availability,
                productUrl: res.productUrl || fetchUrl,
                merchantProductId: res.merchantProductId || newOffers[0].merchantProductId,
            };
            setEditingProductOffers(newOffers);
        }
        setFetchResult({ success: true, message: 'Product information found' });
      }
    } catch (e: any) {
      setFetchResult({ success: false, message: e.message || 'Error fetching product' });
    } finally {
      setIsFetching(false);
    }
  };
"""
code = code.replace("  const [editingOffer, setEditingOffer] = useState<Partial<PriceOffer> | null>(null);", "  const [editingOffer, setEditingOffer] = useState<Partial<PriceOffer> | null>(null);\n" + state_injection)

# 3. Reset state on Add Product
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
    setIsProductModalOpen(true);
  };
"""
code = re.sub(r'const handleAddProduct = \(\) => \{[\s\S]*?setIsProductModalOpen\(true\);\n\s*\};', add_product_replacement.strip(), code)

# 4. Inject Fetch UI in Modal
fetch_ui = """
              {/* FETCH PRODUCT URL */}
              {!editingProduct.id && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">ADD PRODUCT</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Merchant</label>
                      <select
                        value={fetchMerchantId}
                        onChange={(e) => setFetchMerchantId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="">Select Merchant</option>
                        {stores.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Product URL</label>
                      <input
                        type="url"
                        value={fetchUrl}
                        onChange={(e) => setFetchUrl(e.target.value)}
                        placeholder="Paste merchant product URL"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleFetchProduct}
                      disabled={isFetching || !fetchUrl || !fetchMerchantId}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      {isFetching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <span>Fetch Product</span>
                      )}
                    </button>
                    {fetchResult && (
                      <div className={`text-sm font-semibold flex items-center gap-1.5 ${fetchResult.success ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {fetchResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>{fetchResult.message}</span>
                      </div>
                    )}
                  </div>
                  {fetchResult && !fetchResult.success && (
                    <div className="text-xs text-slate-500 mt-2">
                      Please verify/enter the information manually below.
                    </div>
                  )}
                </div>
              )}
"""

code = code.replace('<form onSubmit={handleSaveProduct} className="space-y-6 text-xs">\n              <div className="space-y-4">', '<form onSubmit={handleSaveProduct} className="space-y-6 text-xs">\n' + fetch_ui + '\n              <div className="space-y-4">')

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done python injection")
