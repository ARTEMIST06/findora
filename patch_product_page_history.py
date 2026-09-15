import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Add logic for lowest and highest recorded price
calc_logic = """            {/* Price timeline points visualization */}
            {priceHistory.length > 0 && (() => {
               const allPrices = priceHistory.map(ph => ph.price).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
               const lowestHistory = allPrices.length > 0 ? Math.min(...allPrices) : null;
               const highestHistory = allPrices.length > 0 ? Math.max(...allPrices) : null;
               
               return (
                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                     <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Lowest Recorded</p>
                     <p className="text-xl font-extrabold text-emerald-900">{lowestHistory ? formatINR(lowestHistory) : 'N/A'}</p>
                   </div>
                   <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                     <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">Highest Recorded</p>
                     <p className="text-xl font-extrabold text-rose-900">{highestHistory ? formatINR(highestHistory) : 'N/A'}</p>
                   </div>
                 </div>
               );
            })()}
            
            <div className="pt-2 w-full h-64">"""

if "Lowest Recorded</p>" not in code:
    code = code.replace("            {/* Price timeline points visualization */}\n            <div className=\"pt-2 w-full h-64\">", calc_logic)
    with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
        f.write(code)
    print("Patched ProductDetailPage lowest/highest recorded price")
else:
    print("Already patched ProductDetailPage")

