with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Instead of regex, let's just use string replace.
old_block = '''                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      CURRENT LOWEST PRICE
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                      <span className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-none tracking-tight">
                        {formatINR(product.lowestPrice)}
                      </span>'''

new_block = '''                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      CURRENT LOWEST PRICE
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                      <span className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-none tracking-tight">
                        {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-2xl text-slate-400">Price unavailable</span>}
                      </span>'''

if old_block in code:
    code = code.replace(old_block, new_block)
    print("Replaced!")
else:
    print("Not found.")

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

