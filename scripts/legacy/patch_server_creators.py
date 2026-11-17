import re

with open('server.ts', 'r') as f:
    code = f.read()

# Replace the amazon block
amazon_block = """
      // Check for credentials
      if (merchantId === 'amazon') {
        const credentialId = process.env.AMAZON_CREATORS_API_CREDENTIAL_ID;
        const secret = process.env.AMAZON_CREATORS_API_SECRET;
        const partnerTag = process.env.AMAZON_PARTNER_TAG;

        if (!credentialId || !secret || !partnerTag) {
          return res.status(400).json({ 
            success: false, 
            message: "Amazon automatic product data is not configured yet. (Missing AMAZON_CREATORS_API_CREDENTIAL_ID, AMAZON_CREATORS_API_SECRET, or AMAZON_PARTNER_TAG)" 
          });
        }
        
        const asin = extractASIN(url);
        if (!asin) {
          return res.status(400).json({ success: false, message: "Could not extract ASIN from the provided Amazon URL." });
        }

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
          if (!tokenRes.ok || !tokenData.access_token) {
            console.error("Amazon API Authentication Error:", JSON.stringify(tokenData));
            return res.status(401).json({ success: false, message: "Amazon API Authentication Error. Verify credentials." });
          }

          // 2. Fetch Product from Creators API
          const payload = {
            itemIds: [asin],
            itemIdType: "ASIN",
            marketplace: "www.amazon.in",
            partnerTag: partnerTag,
            resources: [
              "ItemInfo.Title",
              "ItemInfo.ByLineInfo",
              "ItemInfo.Classifications",
              "Offers.Listings.Price",
              "Offers.Listings.Availability.Message",
              "Images.Primary.Large"
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
            return res.status(400).json({ 
               success: false, 
               message: `Amazon API Error: ${errMsg}`
            });
          }

          const item = apiData.ItemsResult?.Items?.[0];
          if (!item) {
            return res.status(404).json({ success: false, message: "Product not found on Amazon." });
          }

          const title = item.ItemInfo?.Title?.DisplayValue || "";
          const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || "";
          const category = item.ItemInfo?.Classifications?.Binding?.DisplayValue || "";
          const images = item.Images?.Primary?.Large?.URL ? [item.Images.Primary.Large.URL] : [];
          
          const listing = item.Offers?.Listings?.[0];
          const price = listing?.Price?.Amount;
          let mrp = listing?.Price?.Savings?.Amount ? price + listing.Price.Savings.Amount : null;
          
          let availabilityMessage = listing?.Availability?.Message || '';
          let availability = 'out_of_stock';
          if (availabilityMessage.toLowerCase().includes('in stock') || price > 0) {
             availability = 'in_stock';
          }

          const affiliateUrl = item.DetailPageURL || "";
          const originalUrl = `https://www.amazon.in/dp/${asin}`;

          return res.json({
            success: true,
            product: {
              title,
              brand,
              category,
              images,
              currentPrice: price || null,
              mrp: mrp || null,
              availability,
              merchantProductId: asin,
              productUrl: originalUrl,
              affiliateUrl: affiliateUrl
            }
          });

        } catch (e: any) {
          console.error("Amazon Request Exception:", e);
          return res.status(500).json({ success: false, message: "Error communicating with Amazon Creators API." });
        }
      }
"""

code = re.sub(r'// Check for credentials\s*if \(merchantId === \'amazon\'\) \{[\s\S]*?// return res\.json\(\{ success: true, product: \{ \.\.\. \} \}\);\s*\}', amazon_block.strip(), code)
code = re.sub(r'// Check for credentials\s*if \(merchantId === \'amazon\'\) \{[\s\S]*?catch \(e: any\) \{[\s\S]*?return res\.status\(500\)\.json\(\{ success: false, message: "Error communicating with Amazon PA-API\." \}\);\s*\}\s*\}', amazon_block.strip(), code)

with open('server.ts', 'w') as f:
    f.write(code)

print("done patch server creators")
