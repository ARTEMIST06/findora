import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Fix the syntax error
code = code.replace(
"""                {bestOffer && (
                  bestOffer.affiliateUrl ? (
                    <a
                      href={bestOffer.affiliateUrl.startsWith('http') ? bestOffer.affiliateUrl : `https://${bestOffer.affiliateUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => store.trackAffiliateClick(product.id, bestOffer.storeId, bestOffer.price, bestOffer.affiliateUrl)}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>Go to {product.bestStore?.name || 'Deal'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => showToast('Merchant link unavailable.', 'error')}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0 opacity-75"
                    >
                      <span>Go to {product.bestStore?.name || 'Deal'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>""",
"""                {bestOffer && (
                  bestOffer.affiliateUrl ? (
                    <a
                      href={bestOffer.affiliateUrl.startsWith('http') ? bestOffer.affiliateUrl : `https://${bestOffer.affiliateUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => store.trackAffiliateClick(product.id, bestOffer.storeId, bestOffer.price, bestOffer.affiliateUrl)}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>Go to {product.bestStore?.name || 'Deal'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => showToast('Merchant link unavailable.', 'error')}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0 opacity-75"
                    >
                      <span>Go to {product.bestStore?.name || 'Deal'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>"""
)

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

print("fixed syntax 2")
