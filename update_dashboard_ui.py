import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# 1. Update handleFetchProduct to populate fetchedFields better
fetch_handler_old = """      } else {
        // Populate form
        setEditingProduct({
          ...editingProduct,
          name: resData.title || editingProduct?.name || '',
          brand: resData.brand || editingProduct?.brand || '',
          category: resData.category || editingProduct?.category || categories[0]?.slug,
          images: resData.images?.length ? resData.images : (editingProduct?.images || []),
        });

        // Populate offer 0
        const newOffers = [...editingProductOffers];
        if (newOffers.length === 0) {
          newOffers.push({ storeId: fetchMerchantId, price: "" as any, originalPrice: "" as any, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' });
        }
        
        newOffers[0] = {
          ...newOffers[0],
          storeId: fetchMerchantId,
          price: resData.price || newOffers[0].price,
          originalPrice: resData.originalPrice || newOffers[0].originalPrice,
          availability: resData.availability || newOffers[0].availability,
          merchantProductId: resData.merchantProductId || newOffers[0].merchantProductId,
          productUrl: fetchUrl,
          affiliateUrl: resData.affiliateUrl || newOffers[0].affiliateUrl,
          syncStatus: resData.merchantProductId ? 'automatic' : 'manual'
        };
        
        setEditingProductOffers(newOffers);
        
        setFetchedFields({
          name: !!resData.title,
          brand: !!resData.brand,
          category: !!resData.category,
          images: !!(resData.images && resData.images.length),
          price: !!resData.price,
          availability: !!resData.availability,
          merchantProductId: !!resData.merchantProductId,
          productUrl: true,
          affiliateUrl: !!resData.affiliateUrl
        });"""

fetch_handler_new = """      } else {
        // Populate form
        setEditingProduct({
          ...editingProduct,
          name: resData.title || editingProduct?.name || '',
          brand: resData.brand || editingProduct?.brand || '',
          category: resData.category || editingProduct?.category || categories[0]?.slug,
          images: resData.images?.length ? resData.images : (editingProduct?.images || []),
        });

        // Populate offer 0
        const newOffers = [...editingProductOffers];
        if (newOffers.length === 0) {
          newOffers.push({ storeId: fetchMerchantId, price: "" as any, originalPrice: "" as any, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' });
        }
        
        newOffers[0] = {
          ...newOffers[0],
          storeId: fetchMerchantId,
          price: resData.price || newOffers[0].price,
          originalPrice: resData.originalPrice || newOffers[0].originalPrice,
          availability: resData.availability || newOffers[0].availability,
          merchantProductId: resData.merchantProductId || newOffers[0].merchantProductId,
          productUrl: fetchUrl,
          affiliateUrl: resData.affiliateUrl || newOffers[0].affiliateUrl,
          syncStatus: resData.isManualCommercial ? 'manual' : (resData.merchantProductId ? 'automatic' : 'manual')
        };
        
        setEditingProductOffers(newOffers);
        
        setFetchedFields({
          name: !!resData.title,
          brand: !!resData.brand,
          category: !!resData.category,
          images: !!(resData.images && resData.images.length),
          price: !!resData.price && !resData.isManualCommercial,
          availability: !!resData.availability && !resData.isManualCommercial,
          merchantProductId: !!resData.merchantProductId,
          productUrl: true,
          affiliateUrl: !!resData.affiliateUrl && !resData.isManualCommercial
        });"""

code = code.replace(fetch_handler_old.strip(), fetch_handler_new.strip())

# 2. Update the Brand field badge
brand_field_old = """                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Brand *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.brand || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      placeholder="Apple"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>"""

brand_field_new = """                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Brand *{fetchedFields.brand && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.brand || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      placeholder="Apple"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>"""

code = code.replace(brand_field_old.strip(), brand_field_new.strip())

# Change ✓ Fetched to ✓ AUTO and add MANUAL to price, mrp, availability
code = code.replace("✓ Fetched</span>}", "✓ AUTO</span>}")

price_field_old = """                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Current Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={offer.price || 0}
                          onChange={(e) => {"""

price_field_new = """                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Current Price (₹) *{fetchedFields.price && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={offer.price || ''}
                          onChange={(e) => {"""
code = code.replace(price_field_old.strip(), price_field_new.strip())

# Same for MRP
mrp_field_old = """                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">MRP (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={offer.originalPrice || ''}
                          onChange={(e) => {"""

mrp_field_new = """                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">MRP (₹){fetchedFields.price && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <input
                          type="number"
                          min={0}
                          value={offer.originalPrice || ''}
                          onChange={(e) => {"""
code = code.replace(mrp_field_old.strip(), mrp_field_new.strip())

# Same for Availability
avail_field_old = """                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Availability *{fetchedFields.availability && idx === 0 && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                        <select"""

avail_field_new = """                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Availability *{fetchedFields.availability && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <select"""
code = code.replace(avail_field_old.strip(), avail_field_new.strip())

# Same for Affiliate URL
aff_field_old = """                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-700">Affiliate URL *</label>
                        <input
                          type="url"
                          required
                          value={offer.affiliateUrl || ''}
                          onChange={(e) => {"""

aff_field_new = """                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-700">Affiliate URL (Tracked Link) *{fetchedFields.affiliateUrl && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <input
                          type="url"
                          required
                          value={offer.affiliateUrl || ''}
                          placeholder="Paste your affiliate link here"
                          onChange={(e) => {"""
code = code.replace(aff_field_old.strip(), aff_field_new.strip())


with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done updating AdminDashboard UI")
