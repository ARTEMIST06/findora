with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

old_offers_text = "{product.offers.length} {product.offers.length === 1 ? 'store offer' : 'store offers found'}"
new_offers_text = "{product.offers.length > 0 ? `${product.offers.length} ${product.offers.length === 1 ? 'store offer' : 'store offers found'}` : 'No store offers found yet.'}"

if old_offers_text in code:
    code = code.replace(old_offers_text, new_offers_text)
    print("Patched offers found")

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

