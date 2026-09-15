import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();




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
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';
    
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogTitleMatch) title = ogTitleMatch[1];
    
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    let image = ogImageMatch ? ogImageMatch[1] : '';
    
    if (!image) {
       // Amazon specific image fallback if og:image fails
       const landingImage = html.match(/"large":"([^"]+)"/);
       if (landingImage) image = landingImage[1];
    }
    
    // Clean amazon title (e.g. "Buy Apple iPhone 16 Pro (128GB) Online at Best Price - Amazon.in")
    title = title.replace(/Buy\s+/i, '').replace(/\s+Online at Best Price.*/i, '').replace(/\s+at Amazon.*/i, '').replace(/\s*:\s*Amazon.*/i, '');
    
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

function extractASIN(url: string): string | null {
  const match = url.match(/(?:dp|o|ASIN|gp\/product|gp\/offer-listing|gp\/product\/ajax)\/([A-Z0-9]{10})/i);
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/fetch-product", async (req, res) => {
    try {
      const { url, merchantId } = req.body;
      
      if (!url || !merchantId) {
        return res.status(400).json({ success: false, message: "URL and merchantId are required" });
      }

      // Check for credentials
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
          } catch (e: any) {
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
              return res.status(400).json({ success: false, message: "API Failed and Could not safely fetch product page metadata." });
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
                affiliateUrl: '',
                isManualCommercial: true,
                warning: errorMessage
              }
           });
        }
      }
      
if (merchantId === 'flipkart') {
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
      }

      return res.status(400).json({ success: false, message: `Automatic product data is not configured for this merchant yet.` });
      
    } catch (error: any) {
      console.error("Fetch Product Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`); console.log("AWS_ID:", process.env.AMAZON_CREATORS_API_CREDENTIAL_ID ? "Set" : "Not Set");
  });
}

startServer();
