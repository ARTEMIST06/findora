import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Remove handleStoreClick
code = re.sub(r'const handleStoreClick = \(offer: \(typeof product\.offers\)\[0\]\) => \{.*?\n  \};\n', '', code, flags=re.DOTALL)

# Replace bestOffer button
best_offer_code = """
                  <button
                    onClick={() => handleStoreClick(bestOffer)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>Go to {product.bestStore?.name || 'Deal'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
"""

best_offer_replacement = """
                  {bestOffer.affiliateUrl ? (
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
"""

code = code.replace(best_offer_code.strip(), best_offer_replacement.strip())

# Replace table offer button
table_offer_code = """
                        <button
                          onClick={() => handleStoreClick(offer)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                            isLowest
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Check Price</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
"""

table_offer_replacement = """
                        {offer.affiliateUrl ? (
                          <a
                            href={offer.affiliateUrl.startsWith('http') ? offer.affiliateUrl : `https://${offer.affiliateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => store.trackAffiliateClick(product.id, offer.storeId, offer.price, offer.affiliateUrl)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                              isLowest
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <span>Check Price</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => showToast('Merchant link unavailable.', 'error')}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs opacity-75 ${
                              isLowest
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <span>Check Price</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
"""
code = code.replace(table_offer_code.strip(), table_offer_replacement.strip())

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

print("done detail page")
