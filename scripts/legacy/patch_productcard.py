import re

with open('src/components/common/ProductCard.tsx', 'r') as f:
    code = f.read()

old_button = '''            <button
              onClick={handleCheckPrice}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Check Deal</span>
            </button>'''

new_button = '''            <button
              onClick={handleCheckPrice}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{product.offers.length > 0 ? 'Check Price' : 'View Details'}</span>
            </button>'''

code = code.replace(old_button, new_button)

# Let's also ensure `handleCheckPrice` checks correctly.
old_handle = '''    } else {
      onNavigate(`/product/${product.slug}`);
    }'''

new_handle = '''    } else {
      onNavigate(`/product/${product.slug}`);
    }'''

with open('src/components/common/ProductCard.tsx', 'w') as f:
    f.write(code)

