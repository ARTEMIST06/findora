const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// 1. handleFetchProduct
code = code.replace(/const newOffers = \[\.\.\.editingProductOffers\];\s*if \(newOffers\.length > 0\) \{[\s\S]*?\}\s*setFetchedFields\(\{[\s\S]*?\}\);/m, `const newOffers = [...editingProductOffers];
        if (newOffers.length === 0) {
          newOffers.push({ storeId: fetchMerchantId, price: "" as any, originalPrice: "" as any, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' });
        }
        
        newOffers[0] = {
          ...newOffers[0],
          storeId: fetchMerchantId,
          price: (resData.price !== undefined && resData.price !== null) ? resData.price : (resData.currentPrice !== undefined ? resData.currentPrice : newOffers[0].price),
          originalPrice: resData.originalPrice || resData.mrp || newOffers[0].originalPrice,
          availability: resData.availability || newOffers[0].availability,
          merchantProductId: resData.merchantProductId || newOffers[0].merchantProductId,
          productUrl: fetchUrl,
          affiliateUrl: resData.affiliateUrl || newOffers[0].affiliateUrl,
          syncStatus: resData.isManualCommercial ? 'manual' : (resData.merchantProductId ? 'automatic' : 'manual')
        };
        
        setEditingProductOffers(newOffers);
        
        setFetchedFields({
          name: !!resData.title,
          brand: !!resData.brand,
          category: !!resData.category,
          images: !!(resData.images && resData.images.length),
          price: !!(resData.price || resData.currentPrice) && !resData.isManualCommercial,
          originalPrice: !!(resData.originalPrice || resData.mrp) && !resData.isManualCommercial,
          availability: !!resData.availability && !resData.isManualCommercial,
          merchantProductId: !!resData.merchantProductId,
          productUrl: true,
          affiliateUrl: !!resData.affiliateUrl && !resData.isManualCommercial
        });`);

// 2. update brand badge
code = code.replace(/<label className="font-semibold text-slate-700">Brand \*<\/label>/, `<label className="font-semibold text-slate-700">Brand *{fetchedFields.brand && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>`);

// 3. update all other fetched badges
code = code.replace(/✓ Fetched/g, "✓ AUTO");

// 4. Update offer fields for manual
code = code.replace(/<label className="font-semibold text-slate-700">Current Price \(₹\) \*<\/label>/, `<label className="font-semibold text-slate-700">Current Price (₹) *{fetchedFields.price && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>`);
code = code.replace(/<label className="font-semibold text-slate-700">MRP \(₹\)<\/label>/, `<label className="font-semibold text-slate-700">MRP (₹){fetchedFields.originalPrice && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>`);

code = code.replace(/<label className="font-semibold text-slate-700">Availability \*\{fetchedFields\.availability && idx === 0 && <span className="ml-2 text-\[10px\] text-emerald-600 font-bold bg-emerald-50 px-1\.5 py-0\.5 rounded">✓ AUTO<\/span>\}<\/label>/, `<label className="font-semibold text-slate-700">Availability *{fetchedFields.availability && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>`);

code = code.replace(/<label className="font-semibold text-slate-700">Affiliate URL \*<\/label>/, `<label className="font-semibold text-slate-700">Affiliate URL (Tracked Link) *{fetchedFields.affiliateUrl && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>`);
code = code.replace(/<label className="font-semibold text-slate-700">Affiliate URL \(Tracked Link\) \*\{fetchedFields.affiliateUrl && idx === 0 \? <span className="ml-2 text-\[10px\] text-emerald-600 font-bold bg-emerald-50 px-1\.5 py-0\.5 rounded">✓ AUTO<\/span> : \(idx === 0 && <span className="ml-2 text-\[10px\] text-amber-600 font-bold bg-amber-50 px-1\.5 py-0\.5 rounded">✎ MANUAL<\/span>\)\}<\/label>\n\s*<input\n\s*type="url"\n\s*required\n\s*value=\{offer\.affiliateUrl \|\| ''\}\n\s*onChange/, `<label className="font-semibold text-slate-700">Affiliate URL (Tracked Link) *{fetchedFields.affiliateUrl && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>\n                        <input\n                          type="url"\n                          required\n                          value={offer.affiliateUrl || ''}\n                          placeholder="Paste your affiliate link here"\n                          onChange`);


fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);
console.log("Updated Dashboard successfully!");
