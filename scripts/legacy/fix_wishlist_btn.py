import re

with open('src/pages/public/WishlistPage.tsx', 'r') as f:
    code = f.read()

# Replace <button onClick={() => handleCheckDeal(product)}
btn_pattern = r'<button\s*onClick=\{.*?handleCheckDeal\(product\).*?\}\s*className="(w-full py-2 px-3 rounded-xl bg-blue-600.*?)"\s*>\s*<span>Go to Deal</span>\s*<ExternalLink className="w-3.5 h-3.5" />\s*</button>'

def btn_replacer(match):
    cls = match.group(1)
    return f"""
                {{product.offers.length > 0 && product.offers[0].affiliateUrl ? (
                  <a
                    href={{product.offers[0].affiliateUrl.startsWith('http') ? product.offers[0].affiliateUrl : `https://${{product.offers[0].affiliateUrl}}`}}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={{() => store.trackAffiliateClick(product.id, product.offers[0].storeId, product.offers[0].price, product.offers[0].affiliateUrl)}}
                    className="{cls}"
                  >
                    <span>Go to Deal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={{() => showToast('Merchant link unavailable.', 'error')}}
                    className="{cls} opacity-75"
                  >
                    <span>Go to Deal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}}
""".strip()

code = re.sub(btn_pattern, btn_replacer, code)

# Remove handleCheckDeal
code = re.sub(r'const handleCheckDeal = \(product: \(typeof wishlistProducts\)\[0\]\) => \{.*?\n  \};\n', '', code, flags=re.DOTALL)

with open('src/pages/public/WishlistPage.tsx', 'w') as f:
    f.write(code)

print("done wishlist page")
