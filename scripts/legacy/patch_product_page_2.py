with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Replace the "store offers found" text
old_offers_text = '''            <p className="text-sm text-slate-500 mt-1">
              {product.offers.length} store offers found
            </p>'''
new_offers_text = '''            <p className="text-sm text-slate-500 mt-1">
              {product.offers.length > 0 ? `${product.offers.length} store offers found` : 'No store offers found yet.'}
            </p>'''

if old_offers_text in code:
    code = code.replace(old_offers_text, new_offers_text)
    print("Patched offers found")
else:
    print("Not found offers found")

# Make sure we don't crash when product.offers is empty
old_best_offer_orig = '''{bestOffer?.originalPrice && bestOffer.originalPrice > (product.lowestPrice || 0) && ('''
new_best_offer_orig = '''{bestOffer?.originalPrice && product.lowestPrice && bestOffer.originalPrice > product.lowestPrice && ('''
if old_best_offer_orig in code:
    code = code.replace(old_best_offer_orig, new_best_offer_orig)

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

