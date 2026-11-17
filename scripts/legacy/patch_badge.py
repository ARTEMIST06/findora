import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

badge_html = """
                    {bestOffer?.priceDrop && (
                      <span className="ml-3 inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {bestOffer.priceDrop.percentage}% OFF (↓{formatINR(bestOffer.priceDrop.amount)})
                      </span>
                    )}
"""

# Insert right after the price line-through block
target = """                    {bestOffer?.originalPrice && product.lowestPrice && bestOffer.originalPrice > product.lowestPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        MRP {formatINR(bestOffer.originalPrice)}
                      </span>
                    )}"""

code = code.replace(target, target + "\n" + badge_html)

# Also check for other places, maybe we should also show it in the store comparisons?
store_row_target = """                          <div className="flex flex-col items-end">
                            <span className="font-bold text-slate-900 text-sm sm:text-base">{formatINR(offer.price)}</span>
                            {offer.originalPrice && offer.originalPrice > offer.price && (
                              <span className="text-xs text-slate-400 line-through">
                                MRP {formatINR(offer.originalPrice)}
                              </span>
                            )}
                          </div>"""

store_row_badge = """                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                              {offer.priceDrop && (
                                <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  ↓{formatINR(offer.priceDrop.amount)}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 text-sm sm:text-base">{formatINR(offer.price)}</span>
                            </div>
                            {offer.originalPrice && offer.originalPrice > offer.price && (
                              <span className="text-xs text-slate-400 line-through">
                                MRP {formatINR(offer.originalPrice)}
                              </span>
                            )}
                          </div>"""

code = code.replace(store_row_target, store_row_badge)

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

print("done patching badge")
