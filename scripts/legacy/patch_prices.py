import re
import os

def patch_file(path, old, new):
    with open(path, 'r') as f:
        code = f.read()
    if old in code:
        code = code.replace(old, new)
        with open(path, 'w') as f:
            f.write(code)
        print(f"Patched {path}")
    else:
        print(f"Not found in {path}")

# In ProductDetailPage.tsx
old_pdp = '''                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatINR(product.lowestPrice)}
                    </span>'''
new_pdp = '''                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-2xl text-slate-400">Price unavailable</span>}
                    </span>'''
patch_file('src/pages/public/ProductDetailPage.tsx', old_pdp, new_pdp)

# In ProductCard.tsx
old_pc = '''              <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider mb-0.5">Lowest Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {formatINR(product.lowestPrice)}
                </span>'''
new_pc = '''              <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider mb-0.5">Lowest Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-sm text-slate-400">Unavailable</span>}
                </span>'''
patch_file('src/components/common/ProductCard.tsx', old_pc, new_pc)

# In ProductDetailPage.tsx where it says "0 store offers found"
old_zero_offers = '''            <p className="text-sm text-slate-500 mt-1">
              {product.offers.length} store offers found
            </p>'''
new_zero_offers = '''            <p className="text-sm text-slate-500 mt-1">
              {product.offers.length > 0 ? `${product.offers.length} store offers found` : 'No store offers found yet.'}
            </p>'''
patch_file('src/pages/public/ProductDetailPage.tsx', old_zero_offers, new_zero_offers)

