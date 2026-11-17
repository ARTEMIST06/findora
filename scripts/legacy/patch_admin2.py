import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

new_modal = """            <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">PRODUCT INFORMATION</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="Apple iPhone 16 Pro (128GB)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Brand *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.brand || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      placeholder="Apple, Samsung, Sony..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Category</label>
                    <select
                      value={editingProduct.category || categories[0]?.slug}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Badge (Optional)</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      placeholder="Editor's Pick, Best Value..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Short Pitch / Subtitle</label>
                  <input
                    type="text"
                    value={editingProduct.shortDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Image URL</label>
                  <input
                    type="url"
                    value={editingProduct.images?.[0] || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Why Findora Picked It</label>
                  <textarea
                    rows={2}
                    value={editingProduct.whyFindora || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, whyFindora: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-sm text-slate-900">STORE OFFERS & PRICING</h4>
                  <button type="button" onClick={() => setEditingProductOffers([...editingProductOffers, { storeId: stores[0]?.id || '', price: 0, originalPrice: 0, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' }])} className="text-blue-600 font-semibold hover:text-blue-700">+ Add Offer</button>
                </div>
                
                {editingProductOffers.map((offer, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">Offer {idx + 1}</span>
                      {editingProductOffers.length > 1 && (
                        <button type="button" onClick={() => setEditingProductOffers(editingProductOffers.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-semibold">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Store *</label>
                        <select
                          required
                          value={offer.storeId || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers];
                            newOffers[idx].storeId = e.target.value;
                            setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="">Select Store</option>
                          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Availability *</label>
                        <select
                          required
                          value={offer.availability || 'in_stock'}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers];
                            newOffers[idx].availability = e.target.value as any;
                            setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="pre_order">Pre-order</option>
                          <option value="limited_stock">Limited Stock</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Current Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={offer.price || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers];
                            newOffers[idx].price = Number(e.target.value);
                            setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">MRP (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={offer.originalPrice || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers];
                            newOffers[idx].originalPrice = Number(e.target.value);
                            setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-700">Affiliate URL *</label>
                        <input
                          type="url"
                          required
                          value={offer.affiliateUrl || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers];
                            newOffers[idx].affiliateUrl = e.target.value;
                            setEditingProductOffers(newOffers);
                          }}
                          placeholder="https://amazon.in/..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">PUBLISHING</h4>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.published ?? true}
                      onChange={(e) => setEditingProduct({ ...editingProduct, published: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">Published on site</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.featured ?? false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>"""

code = re.sub(r'(<form onSubmit=\{handleSaveProduct\}.*?</form>)', new_modal, code, flags=re.DOTALL)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

