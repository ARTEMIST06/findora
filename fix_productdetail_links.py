import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Remove handleStoreClick
code = re.sub(r'const handleStoreClick = \(offer: \(typeof product\.offers\)\[0\]\) => \{.*?\n  \};\n', '', code, flags=re.DOTALL)

# Replace <button onClick={() => handleStoreClick(bestOffer)} ...>
best_offer_btn_pattern = r'<button\s*onClick=\{.*?handleStoreClick\(bestOffer\).*?\}\s*className="(px-6 py-3.*?)"\s*>\s*<span>(.*?)</span>\s*<ExternalLink className="w-4 h-4" />\s*</button>'
def best_offer_replacer(match):
    cls = match.group(1)
    text = match.group(2)
    return f"""
                  {`bestOffer.affiliateUrl ? (
                    <a
                      href={bestOffer.affiliateUrl.startsWith('http') ? bestOffer.affiliateUrl : \\`https://${bestOffer.affiliateUrl}\\`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => store.trackAffiliateClick(product.id, bestOffer.storeId, bestOffer.price, bestOffer.affiliateUrl)}
                      className="{cls}"
                    >
                      <span>{text}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => showToast('Merchant link unavailable.', 'error')}
                      className="{cls}"
                    >
                      <span>{text}</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )`}
""".strip().replace("`", "")

# We need to manually build the replacement to be safe with template strings inside JS.
# Let's just string replace.
