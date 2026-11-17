import re

with open('src/components/common/ProductCard.tsx', 'r') as f:
    code = f.read()

replacement_button = """
            {product.offers.length > 0 && product.offers[0].affiliateUrl ? (
              <a
                href={product.offers[0].affiliateUrl.startsWith('http') ? product.offers[0].affiliateUrl : `https://${product.offers[0].affiliateUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  store.trackAffiliateClick(
                    product.id,
                    product.offers[0].storeId,
                    product.offers[0].price,
                    product.offers[0].affiliateUrl
                  );
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Check Price</span>
              </a>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.offers.length > 0 && !product.offers[0].affiliateUrl) {
                    showToast('Merchant link unavailable', 'error');
                  } else {
                    onNavigate(`/product/${product.slug}`);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>View Details</span>
              </button>
            )}
"""

# Replace the original button
original_btn_pattern = r'<button\s*onClick=\{handleCheckPrice\}\s*className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1\.5 shadow-sm"\s*>\s*<span>\{product\.offers\.length > 0 \? \'Check Price\' : \'View Details\'\}</span>\s*</button>'
code = re.sub(original_btn_pattern, replacement_button.strip(), code)

# We can also remove `handleCheckPrice` completely.
code = re.sub(r'const handleCheckPrice = \(e: React\.MouseEvent\) => \{.*?\n  \};\n', '', code, flags=re.DOTALL)

with open('src/components/common/ProductCard.tsx', 'w') as f:
    f.write(code)

