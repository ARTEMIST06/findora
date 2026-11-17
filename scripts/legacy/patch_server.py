import re

with open('server.ts', 'r') as f:
    code = f.read()

# I want to inject safeExtractMetadata
metadata_function = """
async function safeExtractMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!res.ok) {
       return null;
    }
    
    const html = await res.text();
    
    // Fallback regex parsing since we don't want to install huge DOM parsers
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\\/title>/i);
    let title = titleMatch ? titleMatch[1].strip() : '';
    
    const ogTitleMatch = html.match(/<meta\\s+property="og:title"\\s+content="([^"]+)"/i);
    if (ogTitleMatch) title = ogTitleMatch[1];
    
    const ogImageMatch = html.match(/<meta\\s+property="og:image"\\s+content="([^"]+)"/i);
    let image = ogImageMatch ? ogImageMatch[1] : '';
    
    if (!image) {
       // Amazon specific image fallback if og:image fails
       const landingImage = html.match(/"large":"([^"]+)"/);
       if (landingImage) image = landingImage[1];
    }
    
    // Clean amazon title (e.g. "Buy Apple iPhone 16 Pro (128GB) Online at Best Price - Amazon.in")
    title = title.replace(/Buy\\s+/i, '').replace(/\\s+Online at Best Price.*/i, '').replace(/\\s+at Amazon.*/i, '').replace(/\\s*:\\s*Amazon.*/i, '');
    
    // Basic Brand extraction (guess from title if it's typical format)
    let brand = '';
    const firstWord = title.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
       brand = firstWord; // Weak guess, but safe
    }
    
    return {
      title,
      image,
      brand,
      isMetadataFallback: true
    };
  } catch (e) {
    console.error("Metadata extraction error:", e);
    return null;
  }
}
"""

if "safeExtractMetadata" not in code:
    code = code.replace("function extractASIN", metadata_function.replace(".strip()", ".trim()") + "\nfunction extractASIN")

# Now update the amazon api block to fall back to it
amazon_block_old = """      // Check for credentials
      if (merchantId === 'amazon') {
        const credentialId = process.env.AMAZON_CREATORS_API_CREDENTIAL_ID;
        const secret = process.env.AMAZON_CREATORS_API_SECRET;
        const partnerTag = process.env.AMAZON_PARTNER_TAG || 'findora-21';

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
              "Content-Type": "application/json",
              "Authorization": `Bearer ${tokenData.access_token}`
            },
            body: JSON.stringify(payload)
          });
          
          const apiData = await apiRes.json();
          if (!apiRes.ok) {
            console.error("Amazon Creators API Error:", JSON.stringify(apiData));
            return res.status(400).json({ success: false, message: "Amazon API Error: " + (apiData.message || apiData.code || "Unknown") });
          }

          const items = apiData.items;
          if (!items || items.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found on Amazon." });
          }

          const item = items[0];
          
          let price = null;
          let mrp = null;
          let availability = 'out_of_stock';
          let affiliateUrl = url; // Fallback
          
          const listings = item.offersV2?.listings;
          if (listings && listings.length > 0) {
            const listing = listings[0];
            price = listing.price?.savings?.amount || listing.price?.displayAmount;
            if (typeof price === 'string') {
               price = parseFloat(price.replace(/[^0-9.]/g, ''));
            }
            const origPrice = listing.price?.savings?.percentage ? listing.price?.displayAmount : null;
            if (typeof origPrice === 'string') {
               mrp = parseFloat(origPrice.replace(/[^0-9.]/g, ''));
            }
            
            const availMsg = listing.availability?.message?.toLowerCase() || '';
            if (availMsg.includes('in stock')) availability = 'in_stock';
            else if (availMsg.includes('out of stock')) availability = 'out_of_stock';
            else if (availMsg.includes('left')) availability = 'limited_stock';
            else availability = 'in_stock'; // Guess true if offer exists
            
            affiliateUrl = item.detailPageURL || affiliateUrl;
          }

          return res.json({
            success: true,
            product: {
              merchantProductId: asin,
              title: item.itemInfo?.title?.displayValue || '',
              brand: item.itemInfo?.byLineInfo?.brand?.displayValue || '',
              category: item.itemInfo?.classifications?.productGroup?.displayValue || '',
              images: item.images?.primary?.large?.url ? [item.images.primary.large.url] : [],
              price: price,
              originalPrice: mrp,
              availability: availability,
              affiliateUrl: affiliateUrl
            }
          });

        } catch (e) {
          console.error("Amazon API Exception:", e);
          return res.status(500).json({ success: false, message: "Internal server error contacting Amazon." });
        }
      }"""

amazon_block_new = """      // Check for credentials
      if (merchantId === 'amazon') {
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
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${tokenData.access_token}`
                },
                body: JSON.stringify(payload)
              });
              
              const apiData = await apiRes.json();
              if (!apiRes.ok) {
                console.error("Amazon Creators API Error:", JSON.stringify(apiData));
                apiError = true;
                errorMessage = "Amazon API Error: " + (apiData.message || apiData.code || "AssociateNotEligible");
              } else {
                const items = apiData.items;
                if (!items || items.length === 0) {
                  return res.status(404).json({ success: false, message: "Product not found on Amazon." });
                }

                const item = items[0];
                
                let price = null;
                let mrp = null;
                let availability = 'out_of_stock';
                let affiliateUrl = url; // Fallback
                
                const listings = item.offersV2?.listings;
                if (listings && listings.length > 0) {
                  const listing = listings[0];
                  price = listing.price?.savings?.amount || listing.price?.displayAmount;
                  if (typeof price === 'string') {
                     price = parseFloat(price.replace(/[^0-9.]/g, ''));
                  }
                  const origPrice = listing.price?.savings?.percentage ? listing.price?.displayAmount : null;
                  if (typeof origPrice === 'string') {
                     mrp = parseFloat(origPrice.replace(/[^0-9.]/g, ''));
                  }
                  
                  const availMsg = listing.availability?.message?.toLowerCase() || '';
                  if (availMsg.includes('in stock')) availability = 'in_stock';
                  else if (availMsg.includes('out of stock')) availability = 'out_of_stock';
                  else if (availMsg.includes('left')) availability = 'limited_stock';
                  else availability = 'in_stock'; // Guess true if offer exists
                  
                  affiliateUrl = item.detailPageURL || affiliateUrl;
                }

                return res.json({
                  success: true,
                  product: {
                    merchantProductId: asin,
                    title: item.itemInfo?.title?.displayValue || '',
                    brand: item.itemInfo?.byLineInfo?.brand?.displayValue || '',
                    category: item.itemInfo?.classifications?.productGroup?.displayValue || '',
                    images: item.images?.primary?.large?.url ? [item.images.primary.large.url] : [],
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
           console.log(`Amazon API failed (${errorMessage}). Falling back to safe metadata extraction...`);
           const meta = await safeExtractMetadata(url);
           
           if (!meta) {
              return res.status(400).json({ success: false, message: "Could not safely fetch product page metadata." });
           }
           
           return res.json({
              success: true,
              message: `API Unavailable (${errorMessage}). Safely extracted page metadata. Commercial fields require manual entry.`,
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
      }"""

code = code.replace(amazon_block_old.strip(), amazon_block_new.strip())

# For Croma and Flipkart, if api error, also fallback
other_stores = """      if (merchantId === 'flipkart') {
        const apiKey = process.env.FLIPKART_API_KEY;
        if (!apiKey) {
          const meta = await safeExtractMetadata(url);
          if (meta) {
             return res.json({
                success: true,
                message: `Flipkart API not configured. Safely extracted page metadata. Commercial fields require manual entry.`,
                product: {
                  merchantProductId: '',
                  title: meta.title || '',
                  brand: meta.brand || '',
                  images: meta.image ? [meta.image] : [],
                  price: null,
                  originalPrice: null,
                  availability: null,
                  affiliateUrl: '',
                  isManualCommercial: true
                }
             });
          }
          return res.status(400).json({ success: false, message: "Flipkart automatic product data is not configured yet. (Missing FLIPKART_API_KEY)" });
        }
      }

      if (merchantId === 'croma') {
        const apiKey = process.env.CROMA_API_KEY;
        if (!apiKey) {
          const meta = await safeExtractMetadata(url);
          if (meta) {
             return res.json({
                success: true,
                message: `Croma API not configured. Safely extracted page metadata. Commercial fields require manual entry.`,
                product: {
                  merchantProductId: '',
                  title: meta.title || '',
                  brand: meta.brand || '',
                  images: meta.image ? [meta.image] : [],
                  price: null,
                  originalPrice: null,
                  availability: null,
                  affiliateUrl: '',
                  isManualCommercial: true
                }
             });
          }
          return res.status(400).json({ success: false, message: "Croma automatic product data is not configured yet. (Missing CROMA_API_KEY)" });
        }
      }"""

code = code.replace("""      if (merchantId === 'flipkart') {
        const apiKey = process.env.FLIPKART_API_KEY;
        if (!apiKey) {
          return res.status(400).json({ success: false, message: "Flipkart automatic product data is not configured yet. (Missing FLIPKART_API_KEY)" });
        }
      }

      if (merchantId === 'croma') {
        const apiKey = process.env.CROMA_API_KEY;
        if (!apiKey) {
          return res.status(400).json({ success: false, message: "Croma automatic product data is not configured yet. (Missing CROMA_API_KEY)" });
        }
      }""", other_stores.strip())

with open('server.ts', 'w') as f:
    f.write(code)

print("done patching server.ts")
