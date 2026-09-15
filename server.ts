import express from "express";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

let adminApp;
let adminDb;
try {
  const configStr = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
  const firebaseConfig = JSON.parse(configStr);
  adminApp = initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
  adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
}

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

  // Trust the first proxy (e.g. Nginx, Cloud Run) so rate limiting identifies client IPs correctly
  app.set('trust proxy', 1);

  // Apply Helmet for production security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://apis.google.com", 
          "https://www.gstatic.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "*"], // allow external product images
        connectSrc: [
          "'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com", 
          "wss://*.firebaseio.com",
          "ws://localhost:*", // Vite HMR
          "http://localhost:*", // Vite HMR
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com"
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        frameAncestors: ["'self'", "https://aistudio.google.com", "https://*.googleusercontent.com"], // Allow AI Studio iframe preview
      },
    },
    xFrameOptions: false, // Disable X-Frame-Options to allow framing in AI Studio preview
    crossOriginEmbedderPolicy: false, // Prevents loading external product images if enabled
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for Firebase Google Auth popup
  }));

  // Add Permissions-Policy (Helmet v7 removed it from default, we add it manually)
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });


  app.use(express.json());

  // Configure rate limiter for external API fetches
  const fetchProductLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes window
    max: 200, // Allow up to 200 requests per 5 minutes per IP (supports editor bulk imports)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip} on /api/fetch-product`);
      res.status(429).json({ 
        success: false, 
        message: 'Too many product fetch requests from this IP. Please try again in a few minutes.' 
      });
    }
  });

  // API routes
  
  // Account cleanup route (trusted backend workflow)
  app.post("/api/delete-account-cleanup", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const idToken = authHeader.split('Bearer ')[1];
      
      if (!adminApp || !adminDb) {
        return res.status(500).json({ success: false, message: "Admin SDK not initialized" });
      }
      
      const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      console.log(`[SECURITY] Processing backend data cleanup for user: ${uid}`);
      
      let errors = [];
      
      // 1. Delete security events (Immutable from client)
      try {
        const eventsSnapshot = await adminDb.collection('securityEvents').where('userId', '==', uid).get();
        if (!eventsSnapshot.empty) {
          const batch = adminDb.batch();
          eventsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      } catch (e) {
        console.error("Failed to delete securityEvents:", e);
        errors.push("securityEvents");
      }
      
      // 2. Delete user profile document (Client doesn't have delete permission in rules)
      try {
        await adminDb.collection('users').doc(uid).delete();
      } catch (e) {
        console.error("Failed to delete user profile:", e);
        errors.push("users");
      }
      
      // Note: Firebase Auth account deletion is handled safely by the client SDK to ensure 
      // reliable execution even if the server environment lacks identitytoolkit API scopes.
      
      if (errors.length > 0) {
        return res.status(207).json({ success: true, message: "Partial cleanup", errors });
      }
      
      res.json({ success: true, message: "Backend cleanup successful" });
    } catch (error) {
      console.error("[SECURITY] Delete Account Cleanup Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/fetch-product", fetchProductLimiter, async (req, res) => {
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
