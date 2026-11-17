import re

with open('server.ts', 'r') as f:
    code = f.read()

# Add extractASIN function at the top of startServer
extract_func = """
function extractASIN(url: string): string | null {
  const match = url.match(/(?:dp|o|ASIN|gp\\/product|gp\\/offer-listing|gp\\/product\\/ajax)\\/([A-Z0-9]{10})/i);
  if (match) return match[1];
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i].match(/^[A-Z0-9]{10}$/)) {
        return pathParts[i];
      }
    }
  } catch(e) {}
  return null;
}
"""

if "function extractASIN" not in code:
    code = code.replace("async function startServer() {", "import aws4 from 'aws4';\n\n" + extract_func + "\nasync function startServer() {")

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

        const payload = {
          ItemIds: [asin],
          Resources: [
            "ItemInfo.Title",
            "ItemInfo.ByLineInfo",
            "ItemInfo.Classifications",
            "Offers.Listings.Price",
            "Offers.Listings.Availability.Message",
            "Images.Primary.Large"
          ],
          PartnerTag: partnerTag,
          PartnerType: "Associates",
          Marketplace: "www.amazon.in"
        };

        const host = 'webservices.amazon.in';
        const path = '/paapi5/getitems';
        const region = 'eu-west-1'; 

        const requestOpts = {
          host: host,
          path: path,
          service: 'ProductAdvertisingAPI',
          region: region,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Encoding': 'amz-1.0',
            'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
          },
          body: JSON.stringify(payload)
        };

        const signedRequest = aws4.sign(requestOpts, {
          accessKeyId: credentialId,
          secretAccessKey: secret
        });

        try {
          // aws4 doesn't add https:// to host in the signed object, we need to construct it
          const apiRes = await fetch(`https://${host}${path}`, {
            method: 'POST',
            // @ts-ignore
            headers: signedRequest.headers,
            body: requestOpts.body
          });

          const apiData = await apiRes.json();
          
          if (!apiRes.ok || apiData.Errors) {
            console.error("Amazon API Error:", JSON.stringify(apiData.Errors));
            const errMsg = apiData.Errors?.[0]?.Message || apiRes.statusText;
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
          return res.status(500).json({ success: false, message: "Error communicating with Amazon PA-API." });
        }
      }
"""

code = re.sub(r'// Check for credentials\s*if \(merchantId === \'amazon\'\) \{[\s\S]*?// return res\.json\(\{ success: true, product: \{ \.\.\. \} \}\);\s*\}', amazon_block.strip(), code)

with open('server.ts', 'w') as f:
    f.write(code)

print("done patch server amazon")
