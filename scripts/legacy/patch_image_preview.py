import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

image_old = """                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Image URL{fetchedFields.images && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                  <input
                    type="url"
                    value={editingProduct.images?.[0] || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>"""

image_new = """                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Image URL{fetchedFields.images && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                  <div className="flex gap-4">
                    <input
                      type="url"
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                    {editingProduct.images?.[0] && (
                      <img src={editingProduct.images[0]} alt="Preview" className="w-10 h-10 object-contain rounded-lg border border-slate-200" />
                    )}
                  </div>
                </div>"""

code = code.replace(image_old.strip(), image_new.strip())

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done patching image preview")
