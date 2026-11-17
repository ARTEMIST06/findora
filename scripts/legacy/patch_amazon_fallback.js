const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(merchantId === 'amazon'\) \{[\s\S]*?catch \(e: any\) \{[\s\S]*?return res\.status\(500\)\.json\([^)]+\);[\s\S]*?\}[\s\S]*?\}/;
const match = code.match(regex);

if (match) {
  const newBlock = `if (merchantId === 'amazon') {
        const credentialId = process.env.AMAZON_CREATORS_API_CREDENTIAL_ID;
        const secret = process.env.AMAZON_CREATORS_API_SECRET;
        const partnerTag = process.env.AMAZON_PARTNER_TAG || 'findora-21';
        
        const asin = extractASIN(url);
        if (!asin) {
          return res.status(400).json({ success: false, message: "Could not extract ASIN from the provided Amazon URL." });
        }

        let apiError = false;
        let errorMessage = "";

        if (!credentialId || !secret || !partnerTag) {
          apiError = true;
          errorMessage = "Amazon API keys not configured";
        } else {
          try {
            // 1. Fetch OAuth Token
            const tokenRes = await fetch("https://api.amazon.com/auth/o2/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: credentialId,
                client_secret: secret,
                scope: "creatorsapi::default"
              })
            });
            const tokenData = await tokenRes.json();
            
            // Check for AssociateNotEligible
            if (!tokenRes.ok || !tokenData.access_token) {
              console.error("Amazon API Authentication Error:", JSON.stringify(tokenData));
              apiError = true;
              errorMessage = "Amazon API Error: " + (tokenData.error_description || tokenData.error || "AssociateNotEligible");
            } else {
              // 2. Fetch Product from Creators API
              const payload = {
                itemIds: [asin],
                itemIdType: "ASIN",
                marketplace: "www.amazon.in",
                partnerTag: partnerTag,
                resources: [
                  "itemInfo.title",
                  "itemInfo.byLineInfo",
                  "itemInfo.classifications",
                  "offersV2.listings.price",
                  "offersV2.listings.availability",
                  "images.primary.large"
                ]
              };

              const apiRes = await fetch("https://creatorsapi.amazon/catalog/v1/getItems", {
                method: "POST",
                headers: {
                  "Authorization": "Bearer " + tokenData.access_token,
                  "Content-Type": "application/json",
                  "x-marketplace": "www.amazon.in"
                },
                body: JSON.stringify(payload)
              });
              
              const apiData = await apiRes.json();
              if (!apiRes.ok || apiData.Errors) {
                console.error("Amazon API Error:", JSON.stringify(apiData));
                const errMsg = apiData.message || apiData.Errors?.[0]?.Message || apiRes.statusText;
                apiError = true;
                errorMessage = "Amazon API Error: " + errMsg;
              } else {
                const item = apiData.itemsResult?.items?.[0] || apiData.ItemsResult?.Items?.[0];
                if (!item) {
                  return res.status(404).json({ success: false, message: "Product not found on Amazon." });
                }
                
                const title = item.itemInfo?.title?.displayValue || item.ItemInfo?.Title?.DisplayValue || "";
                const brand = item.itemInfo?.byLineInfo?.brand?.displayValue || item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || "";
                const category = item.itemInfo?.classifications?.binding?.displayValue || item.ItemInfo?.Classifications?.Binding?.DisplayValue || "";
                const images = item.images?.primary?.large?.url ? [item.images.primary.large.url] : (item.Images?.Primary?.Large?.URL ? [item.Images.Primary.Large.URL] : []);
                
                const listing = item.offersV2?.listings?.[0] || item.Offers?.Listings?.[0] || item.offers?.listings?.[0];
                const price = listing?.price?.amount || listing?.Price?.Amount || null;
                let mrp = listing?.price?.savings?.amount ? price + listing.price.savings.amount : null;
                if (mrp === null && listing?.Price?.Savings?.Amount) mrp = price + listing.Price.Savings.Amount;
                
                let availabilityMessage = listing?.availability?.message || listing?.Availability?.Message || '';
                let availability = 'out_of_stock';
                if (availabilityMessage.toLowerCase().includes('in stock') || price > 0) {
                   availability = 'in_stock';
                }
                
                const affiliateUrl = item.detailPageURL || item.DetailPageURL || "";
                
                return res.json({
                  success: true,
                  product: {
                    merchantProductId: asin,
                    title,
                    brand,
                    category,
                    images,
                    price: price,
                    originalPrice: mrp,
                    availability: availability,
                    affiliateUrl: affiliateUrl,
                    isManualCommercial: false
                  }
                });
              }
            }
          } catch (e) {
            console.error("Amazon API Exception:", e);
            apiError = true;
            errorMessage = "Internal server error contacting Amazon.";
          }
        }
        
        // --- SAFE FALLBACK TO METADATA ---
        if (apiError) {
           console.log(\`Amazon API failed (\${errorMessage}). Falling back to safe metadata extraction...\`);
           const meta = await safeExtractMetadata(url);
           
           if (!meta) {
              return res.status(400).json({ success: false, message: "API Failed and Could not safely fetch product page metadata." });
           }
           
           return res.json({
              success: true,
              message: \`API Unavailable (\${errorMessage}). Safely extracted page metadata. Commercial fields require manual entry.\`,
              product: {
                merchantProductId: asin,
                title: meta.title || '',
                brand: meta.brand || '',
                images: meta.image ? [meta.image] : [],
                price: null,
                originalPrice: null,
                availability: null,
                affiliateUrl: '', // Explicitly empty to force manual affiliate entry
                isManualCommercial: true,
                warning: errorMessage
              }
           });
        }
      }`;
      
  code = code.replace(regex, newBlock);
  fs.writeFileSync('server.ts', code);
  console.log("Successfully patched Amazon block");
} else {
  console.log("Regex not found");
}
