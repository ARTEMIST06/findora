import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

replacement = """
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Current Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={offer.price || 0}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], price: Number(e.target.value) }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">MRP (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={offer.originalPrice || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], originalPrice: Number(e.target.value) }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Merchant Product ID</label>
                        <input
                          type="text"
                          value={offer.merchantProductId || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], merchantProductId: e.target.value }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Original Product URL</label>
                        <input
                          type="url"
                          value={offer.productUrl || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], productUrl: e.target.value }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Sync Status</label>
                        <select
                          value={offer.syncStatus || 'manual'}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], syncStatus: e.target.value as any }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="manual">Manual</option>
                          <option value="automatic">Automatic Sync</option>
                          <option value="error">Error</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-700">Affiliate URL *</label>
                        <input
                          type="url"
                          required
                          value={offer.affiliateUrl || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], affiliateUrl: e.target.value }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
"""
# Replace from `<div className="space-y-1">...Current Price` down to `</input>...</div>` for affiliate
pattern = r'<div className="space-y-1">\s*<label className="font-semibold text-slate-700">Current Price \(₹\) \*</label>[\s\S]*?placeholder="https://amazon.in/..."\s*className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"\s*/>\s*</div>'
code = re.sub(pattern, replacement.strip(), code)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done offer fields 2")
