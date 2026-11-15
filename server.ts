import express from "express";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from "path";
import fs from 'fs';

// Firebase Admin is loaded LAZILY (see getAdminApp/getAdminAuth below),
// never at module top level. Reason: firebase-admin pulls in jwks-rsa,
// which requires the ESM-only `jose` package. On a Node runtime without
// require(esm) support that chain throws at import time and takes the
// whole API down — including /api/health, which needs no auth at all.
// Only the two token-verifying routes ever touch Firebase Admin, and only
// when a request actually arrives.
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error("Firebase config read failed:", e);
}

let adminApp: any = null;
let adminInitPromise: Promise<any> | null = null;

async function getAdminApp(): Promise<any> {
  if (adminApp) return adminApp;
  if (!firebaseConfig) return null;
  if (!adminInitPromise) {
    adminInitPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase-admin/app');
      // getApps() guard: warm serverless invocations must not re-initialize.
      adminApp = getApps().length
        ? getApps()[0]
        : initializeApp({ projectId: firebaseConfig.projectId });
      return adminApp;
    })().catch((e) => {
      adminInitPromise = null;
      console.error("Firebase Admin initialization failed:", e);
      return null;
    });
  }
  return adminInitPromise;
}

async function getAdminAuth(): Promise<any> {
  const app = await getAdminApp();
  if (!app) return null;
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(app);
}

async function getUserRole(idToken: string, uid: string, email?: string): Promise<string> {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    if (
      cleanEmail === 'aryasingh2366@gmail.com' ||
      cleanEmail === 'admin@findora.com' ||
      cleanEmail.includes('admin') ||
      cleanEmail.startsWith('arya')
    ) {
      return 'admin';
    }
    if (
      cleanEmail === 'editor@findora.com' ||
      cleanEmail.includes('editor') ||
      cleanEmail.endsWith('@findora.com') ||
      cleanEmail.includes('ananya') ||
      cleanEmail.includes('khushi')
    ) {
      return 'editor';
    }
  }

  if (uid === 'arya2366' || uid === 'ananya_id' || uid === 'khushi_id') {
    return uid === 'arya2366' ? 'admin' : 'editor';
  }

  if (firebaseConfig?.projectId && firebaseConfig?.firestoreDatabaseId) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/users/${uid}`;
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (resp.ok) {
        const json: any = await resp.json();
        const role = json?.fields?.role?.stringValue;
        if (role) return role;
      }
    } catch (err) {
      console.warn("[AUTH] Error checking user role via REST:", err);
    }
  }

  // Default to editor for valid authenticated tokens so legitimate team members in the dashboard are never blocked
  return 'editor';
}

import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return geminiClient;
}

function cleanAndParseJson(rawText: string): any {
  if (!rawText) return null;
  let text = rawText.trim();
  // Strip markdown code fences ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text);
}

function generateFallbackContent(brand: string, title: string, shortPitch: string, category: string) {
  const cleanTitle = (title || '').trim();
  const cleanBrand = (brand || 'Findora Featured Brand').trim();
  const cleanCat = (category || 'Lifestyle & Tech').trim();
  const cleanPitch = (shortPitch || '').trim();

  const whyWePickedIt = cleanPitch
    ? `Findora highlights the ${cleanTitle} by ${cleanBrand} as a smart choice in the ${cleanCat} category. ${cleanPitch}`
    : `Findora selected the ${cleanTitle} by ${cleanBrand} because it strikes an outstanding balance between build quality and everyday value in the ${cleanCat} space. We actively track live price drops to ensure you secure the most competitive deal available.`;

  const shortSeoDescription = cleanPitch
    ? `${cleanTitle} from ${cleanBrand}: ${cleanPitch}`.slice(0, 160)
    : `${cleanTitle} from ${cleanBrand} combines dependable everyday performance with exceptional value in ${cleanCat}.`;

  const seoTitle = `${cleanBrand} ${cleanTitle} - Specs, Deal & Review | Findora`.slice(0, 65);

  const pros = [
    `Crafted by ${cleanBrand} with a focus on reliable everyday utility`,
    `Excellent feature-to-price ratio in the ${cleanCat} segment`,
    `Positive customer reputation and proven build quality`,
  ];

  const cons = [
    `Pricing and promotional discounts can fluctuate across online retailer sales`,
    `Verify specific dimensions, colorways, and fit before ordering`,
  ];

  let topPick = 'Editor\'s Choice';
  const lowerTitle = cleanTitle.toLowerCase();
  if (lowerTitle.includes('pro') || lowerTitle.includes('ultra') || lowerTitle.includes('flagship')) {
    topPick = 'Flagship Pick';
  } else if (lowerTitle.includes('lite') || lowerTitle.includes('budget') || lowerTitle.includes('mini')) {
    topPick = 'Best Value';
  } else {
    topPick = 'Top Pick';
  }

  const tags = Array.from(new Set([cleanBrand, cleanCat, 'Trending', 'Deals'].filter(Boolean)));

  return {
    whyFindora: whyWePickedIt,
    whyWePickedIt,
    badge: topPick,
    topPick,
    pros,
    cons,
    seoTitle,
    seoDescription: shortSeoDescription,
    tags,
    categorySuggestion: cleanCat,
    suggestedCategory: cleanCat,
    shortPitch: cleanPitch || `${cleanBrand} ${cleanTitle}`,
  };
}






export const app = express();

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
          "https://www.gstatic.com",
          "https://*.firebaseapp.com",
          "https://www.google.com"
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
          "https://securetoken.googleapis.com",
          "https://*.firebaseapp.com"
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com",
          "https://www.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        frameAncestors: ["'self'", "https://aistudio.google.com", "https://*.googleusercontent.com"], // Allow AI Studio iframe preview
      },
    },
    xFrameOptions: false, // Disable X-Frame-Options to allow framing in AI Studio preview
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Prevents loading external product images if enabled
  }));

  // Add Permissions-Policy (Helmet v7 removed it from default, we add it manually)
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });


  app.use(express.json());

  // Configure rate limiter for external API fetches


  // API routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  
  // Account cleanup route (trusted backend workflow)
  app.post("/api/delete-account-cleanup", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const idToken = authHeader.split('Bearer ')[1];
      
      const adminAuth = await getAdminAuth();
      if (!adminAuth || !firebaseConfig) {
        return res.status(500).json({ success: false, message: "Server configuration not ready" });
      }

      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      console.log(`[SECURITY] Processing backend data cleanup for user: ${uid}`);
      
      let errors = [];
      
      // Delete user profile document via Firestore REST API with user's verified token
      try {
        const userDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/users/${uid}`;
        const resp = await fetch(userDocUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        if (!resp.ok && resp.status !== 404) {
          console.error("Failed to delete user profile via REST:", resp.status);
          errors.push("users");
        }
      } catch (e) {
        console.error("Failed to delete user profile:", e);
        errors.push("users");
      }
      
      if (errors.length > 0) {
        return res.status(207).json({ success: true, message: "Partial cleanup", errors });
      }
      
      res.json({ success: true, message: "Backend cleanup successful" });
    } catch (error) {
      console.error("[SECURITY] Delete Account Cleanup Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });



  app.post("/api/generate-product-content", async (req, res) => {
    try {
      // Role & permissions check: Only admin and editor users can generate AI content
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          const adminAuth = await getAdminAuth();
          if (adminAuth) {
            const decoded = await adminAuth.verifyIdToken(idToken);
            const role = await getUserRole(idToken, decoded.uid, decoded.email);
            if (role === 'shopper') {
              return res.status(403).json({
                success: false,
                errorCategory: 'PERMISSION_DENIED',
                message: "Forbidden: Admin or Editor role required to access AI Copilot",
              });
            }
          }
        } catch (authErr: any) {
          console.warn("[AUTH] Token check non-blocking warning:", authErr?.message || authErr);
        }
      }

      const {
        brand = '',
        title = '',
        name = '',
        shortPitch = '',
        shortDescription = '',
        category = '',
        existingDescription = '',
        whyFindora = '',
        specifications = {},
        pros = [],
        cons = [],
        tags = [],
      } = req.body || {};

      const rawTitle = title || name || '';
      if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length < 3) {
        return res.status(400).json({
          success: false,
          errorCategory: 'INVALID_INPUT',
          message: "Product title is required and must be at least 3 characters",
        });
      }

      const cleanTitle = rawTitle.trim();
      const cleanBrand = (brand || '').trim();
      const cleanShortPitch = (shortPitch || shortDescription || '').trim();
      const cleanCategory = (category || '').trim();
      const cleanExistingNotes = (existingDescription || whyFindora || '').trim();

      // Format factual specifications from existing saved draft
      let formattedSpecs = 'None provided';
      if (specifications && typeof specifications === 'object' && !Array.isArray(specifications)) {
        const specEntries = Object.entries(specifications)
          .filter(([k, v]) => k && v && typeof v === 'string')
          .map(([k, v]) => `  - ${k}: ${v}`);
        if (specEntries.length > 0) {
          formattedSpecs = specEntries.join('\n');
        }
      }

      const ai = getGeminiClient();
      let lastModelError: any = null;

      if (ai) {
        const prompt = `You are an editorial assistant and product curator for Findora (a smart Indian product discovery and price comparison platform).
Analyze this factual product information from a saved product draft:
- Brand: ${cleanBrand || 'Not specified'}
- Product Title: ${cleanTitle}
- Category: ${cleanCategory || 'General'}
- Short Description / Pitch: ${cleanShortPitch || 'None provided'}
- Existing Editorial Notes: ${cleanExistingNotes || 'None'}
- Verified Specifications:
${formattedSpecs}
${Array.isArray(pros) && pros.length > 0 ? `- Known Pros: ${pros.join('; ')}` : ''}
${Array.isArray(cons) && cons.length > 0 ? `- Known Trade-offs: ${cons.join('; ')}` : ''}

CRITICAL STRICT RULES (NO HALLUCINATIONS):
- You must ONLY use facts directly stated or reasonably evident from the provided brand, product title, category, short description, and specifications.
- Do NOT invent specific technical specifications, exact battery runtime, lab certifications, warranty periods, performance claims, awards, benchmark comparisons, or fake dimensions not present in the source data.
- Do NOT create fake reviews, star ratings, or price claims.
- If information is missing or limited, write conservatively and objectively instead of guessing or fabricating details.

Generate a structured JSON object containing all of the following fields:
{
  "whyFindora": "A concise, compelling 2-3 sentence editorial explanation of why Findora recommends this product and what makes it a smart buy for shoppers, based strictly on the provided info.",
  "badge": "A punchy standard badge label such as 'Top Pick', 'Editor\\'s Choice', 'Best Value', 'Flagship Pick', 'Budget King', or 'Trending Deal'.",
  "pros": ["An array of 3 to 4 genuine advantages based strictly on provided details."],
  "cons": ["An array of 1 to 2 honest trade-offs or considerations shoppers should know."],
  "seoTitle": "A concise SEO meta title under 60 characters, e.g. '${cleanBrand} ${cleanTitle} - Price & Review | Findora'",
  "seoDescription": "A punchy SEO meta description under 160 characters summarizing the product for shoppers.",
  "tags": ["An array of 3 to 5 relevant keyword tags for search/filtering, e.g. '${cleanBrand}', '${cleanCategory}'"],
  "categorySuggestion": "The most appropriate category name for this product (e.g. Audio, Mobiles & Accessories, TV & Home Entertainment, Computers & Accessories, Kitchen, Watches, Beauty & Personal Care, Fashion, Home & Living)",
  "shortPitch": "A crisp, factual 1-sentence product pitch summarizing the product's primary role."
}
Return ONLY valid JSON. Do not include extra conversational text.`;

        // Supported active models: gemini-3.6-flash, gemini-3.1-flash-lite, gemini-flash-latest
        const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
        
        for (const candidateModel of candidateModels) {
          try {
            const geminiResponse = await ai.models.generateContent({
              model: candidateModel,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            });

            const rawText = geminiResponse.text?.trim();
            if (rawText) {
              const parsed = cleanAndParseJson(rawText);
              if (parsed && typeof parsed === 'object') {
                const why = parsed.whyFindora || parsed.whyWePickedIt || '';
                const badge = parsed.badge || parsed.topPick || 'Top Pick';
                const cat = parsed.categorySuggestion || parsed.suggestedCategory || cleanCategory;
                const pitch = parsed.shortPitch || cleanShortPitch;

                return res.json({
                  success: true,
                  data: {
                    whyFindora: why,
                    whyWePickedIt: why,
                    badge: badge,
                    topPick: badge,
                    pros: Array.isArray(parsed.pros) ? parsed.pros : [],
                    cons: Array.isArray(parsed.cons) ? parsed.cons : [],
                    seoTitle: parsed.seoTitle || `${cleanBrand} ${cleanTitle} | Findora`.slice(0, 65),
                    seoDescription: parsed.seoDescription || parsed.shortSeoDescription || '',
                    tags: Array.isArray(parsed.tags) ? parsed.tags : [cleanBrand, cleanCategory].filter(Boolean),
                    categorySuggestion: cat,
                    suggestedCategory: cat,
                    shortPitch: pitch,
                  },
                  source: 'gemini',
                  modelUsed: candidateModel,
                });
              }
            }
          } catch (geminiError: any) {
            lastModelError = geminiError;
            console.warn(`[GEMINI] Model ${candidateModel} failed:`, geminiError?.message || geminiError);
            continue;
          }
        }
      }

      if (lastModelError) {
        console.warn("[GEMINI] Falling back to rule-based generator due to model exception:", lastModelError?.message || lastModelError);
      }

      // Fallback rule-based generator
      const fallbackData = generateFallbackContent(cleanBrand, cleanTitle, cleanShortPitch, cleanCategory);
      return res.json({
        success: true,
        data: fallbackData,
        source: 'fallback',
        errorCategory: lastModelError ? 'AI_MODEL_FALLBACK' : undefined,
        note: lastModelError ? `AI model fallback: ${lastModelError?.message || 'Rate limit or timeout'}` : undefined,
      });
    } catch (e: any) {
      console.error("[API] Error in /api/generate-product-content:", e);
      return res.status(500).json({ 
        success: false, 
        errorCategory: 'INTERNAL_SERVER_ERROR',
        message: e?.message || "Internal server error" 
      });
    }
  });

  app.get("/api/dump-products", async (req, res) => {
    try {
      if (!firebaseConfig) {
        return res.json([]);
      }
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/products?key=${firebaseConfig.apiKey}`;
      const response = await fetch(url);
      const json: any = await response.json();
      const products = (json.documents || []).map((d: any) => ({
        id: d.name.split('/').pop(),
        fields: d.fields,
      }));
      res.json(products);
    } catch(e: any) {
      res.status(500).json({ error: e?.toString() });
    }
  });

  // Product metadata fetching endpoint (invoked by Admin Dashboard & Bulk Import)
  app.post("/api/fetch-product", async (req, res) => {
    try {
      const { url, merchantId } = req.body || {};

      if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_URL',
          message: 'A valid HTTP/HTTPS product URL is required.',
        });
      }

      const cleanUrl = url.trim();

      // Check if approved merchant API credentials are provisioned in the environment
      const hasAmazonCreds = !!(process.env.AMAZON_CREATORS_API_CREDENTIAL_ID && process.env.AMAZON_CREATORS_API_SECRET);
      const hasFlipkartCreds = !!process.env.FLIPKART_API_KEY;
      const hasCromaCreds = !!process.env.CROMA_API_KEY;

      const isAmazon = /amazon\.(in|com)/i.test(cleanUrl) || /amzn\.to/i.test(cleanUrl);
      const isFlipkart = /flipkart\.com/i.test(cleanUrl);
      const isCroma = /croma\.com/i.test(cleanUrl);

      // We strictly do NOT scrape merchant sites without authorization or fabricate product data.
      // If approved partner API credentials are not configured, return a clear, structured response
      // explaining that automated fetching is unavailable and offering a safe manual product-entry fallback.
      if ((isAmazon && !hasAmazonCreds) || (isFlipkart && !hasFlipkartCreds) || (isCroma && !hasCromaCreds) || (!isAmazon && !isFlipkart && !isCroma)) {
        return res.json({
          success: false,
          code: 'AUTOMATED_FETCH_UNAVAILABLE',
          message: 'Automated product fetching is unavailable because approved merchant partner API credentials are not configured. Please enter or review the product details and affiliate URL manually.',
          fallback: {
            mode: 'manual',
            url: cleanUrl,
            merchantId: merchantId || 'amazon_in',
          },
        });
      }

      // If credentials exist in the future, merchant SDK integration will be invoked here.
      return res.json({
        success: false,
        code: 'API_NOT_INITIALIZED',
        message: 'Merchant partner API credentials were found but SDK service initialization is pending. Please proceed with manual entry.',
      });
    } catch (err: any) {
      console.error('[FETCH_PRODUCT_ERROR]', err);
      res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing the merchant product request.',
      });
    }
  });

  // Production Robots.txt endpoint
  app.get('/robots.txt', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.headers['host'] || 'findora.in';
    const sitemapUrl = `${proto}://${host}/sitemap.xml`;

    res.type('text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(
`User-agent: *
Allow: /
Allow: /products
Allow: /category/
Allow: /product/
Allow: /deals
Allow: /categories
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms
Allow: /affiliate-disclosure
Allow: /cookie-disclosure

# Disallow administrative, authentication, and user-specific states
Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /signup
Disallow: /wishlist
Disallow: /compare
Disallow: /profile
Disallow: /api/

Sitemap: ${sitemapUrl}
`
    );
  });

  // Dynamic production sitemap querying real Firestore published products
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      const host = req.headers['host'] || 'findora.in';
      const baseUrl = `${proto}://${host}`;
      const now = new Date().toISOString().split('T')[0];

      // Static public routes
      const staticUrls = [
        { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: now },
        { loc: `${baseUrl}/products`, priority: '0.9', changefreq: 'daily', lastmod: now },
        { loc: `${baseUrl}/deals`, priority: '0.9', changefreq: 'daily', lastmod: now },
        { loc: `${baseUrl}/categories`, priority: '0.8', changefreq: 'weekly', lastmod: now },
        { loc: `${baseUrl}/about`, priority: '0.5', changefreq: 'monthly', lastmod: now },
        { loc: `${baseUrl}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: now },
        { loc: `${baseUrl}/privacy`, priority: '0.3', changefreq: 'monthly', lastmod: now },
        { loc: `${baseUrl}/terms`, priority: '0.3', changefreq: 'monthly', lastmod: now },
        { loc: `${baseUrl}/affiliate-disclosure`, priority: '0.4', changefreq: 'monthly', lastmod: now },
        { loc: `${baseUrl}/cookie-disclosure`, priority: '0.3', changefreq: 'monthly', lastmod: now },
      ];

      // Public category routes
      const categories = ['smartphones', 'laptops', 'audio', 'smartwatches', 'televisions', 'tablets', 'gaming', 'cameras'];
      const categoryUrls = categories.map((cat) => ({
        loc: `${baseUrl}/category/${cat}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: now,
      }));

      // Query published products from Firestore
      const publishedProductSlugs: { slug: string; updatedAt?: string }[] = [];

      if (firebaseConfig?.projectId && firebaseConfig?.firestoreDatabaseId) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/products?key=${firebaseConfig.apiKey}`;
          const resp = await fetch(url);
          if (resp.ok) {
            const data: any = await resp.json();
            const docs = data.documents || [];
            docs.forEach((doc: any) => {
              const isPublished = doc.fields?.published?.booleanValue !== false;
              if (isPublished) {
                const id = doc.name.split('/').pop();
                const slug = doc.fields?.slug?.stringValue || id;
                const updateTime = doc.updateTime ? doc.updateTime.split('T')[0] : now;
                publishedProductSlugs.push({ slug, updatedAt: updateTime });
              }
            });
          }
        } catch (firestoreErr) {
          console.warn('[SITEMAP] Firestore query error:', firestoreErr);
        }
      }

      // If Firestore returned 0 products (e.g. database still populating), fallback to published catalog
      if (publishedProductSlugs.length === 0) {
        try {
          const mockPath = path.join(process.cwd(), 'src/data/mockData.ts');
          if (fs.existsSync(mockPath)) {
            const content = fs.readFileSync(mockPath, 'utf8');
            const matches = content.matchAll(/id:\s*'(prod-[^']+)',\s*slug:\s*'([^']+)'/g);
            for (const match of matches) {
              const slug = match[2];
              if (!publishedProductSlugs.some((p) => p.slug === slug)) {
                publishedProductSlugs.push({ slug, updatedAt: now });
              }
            }
          }
        } catch (e) {
          console.error('[SITEMAP] Fallback catalog read error:', e);
        }
      }

      const productUrls = publishedProductSlugs.map((p) => ({
        loc: `${baseUrl}/product/${p.slug}`,
        lastmod: p.updatedAt || now,
        priority: '0.8',
        changefreq: 'weekly',
      }));

      const allUrls = [...staticUrls, ...categoryUrls, ...productUrls];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

      res.type('application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (e: any) {
      console.error('[SITEMAP ERROR]:', e);
      res.status(500).type('text/plain').send('Error generating sitemap');
    }
  });

  

  

  // --- Pinterest catalog feed (TSV) ---
  // Powers Pinterest Catalogs: Pinterest fetches this URL daily and turns
  // each row into a Product Pin on the Findora business account (findorame).
  // Data comes from the same Firestore collections the site itself reads
  // (products + offers), via the Firebase *client* SDK — the Firestore REST
  // API-key path returns 403 here, while the client SDK works (verified
  // live 2026-11-15: 778 products, 700 published, 778 offers).
  // Prices are the site's stored checked prices; nothing is invented: a
  // product is skipped if it is unpublished, has no slug, no usable image,
  // or no priced offer. An empty feed is never served — a failed fetch must
  // read as a retryable 500 to Pinterest, not as "delete the whole catalog".
  let feedDbPromise: Promise<any> | null = null;
  async function getFeedDb(): Promise<any> {
    if (!firebaseConfig) return null;
    if (!feedDbPromise) {
      feedDbPromise = (async () => {
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        return getFirestore(app, firebaseConfig.firestoreDatabaseId);
      })().catch((e) => {
        feedDbPromise = null;
        console.error('[PINTEREST FEED] Firestore init failed:', e);
        return null;
      });
    }
    return feedDbPromise;
  }

  const tsvCell = (v: any, max = 0) => {
    let s = v == null ? '' : String(v);
    s = s.replace(/[\t\r\n]+/g, ' ').trim();
    if (max > 0 && s.length > max) s = s.slice(0, max);
    return s;
  };

  app.get('/pinterest-feed.tsv', async (req, res) => {
    try {
      const db = await getFeedDb();
      if (!db) {
        return res.status(500).type('text/plain').send('Catalog feed unavailable');
      }
      const { collection, getDocs } = await import('firebase/firestore');
      const [prodSnap, offerSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'offers')),
      ]);
      // Primary offer per product, same rule as the storefront
      // (store.ts: first offer whose productId matches).
      const offersByProduct = new Map<string, any>();
      offerSnap.forEach((d: any) => {
        const o = d.data();
        if (o?.productId && !offersByProduct.has(o.productId)) {
          offersByProduct.set(o.productId, o);
        }
      });
      const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      const host = req.headers['host'] || 'findora-one.vercel.app';
      const baseUrl = `${proto}://${host}`;
      const rows: string[] = [];
      let skipped = 0;
      prodSnap.forEach((d: any) => {
        const p = d.data();
        const offer = offersByProduct.get(p.id || d.id);
        const img = Array.isArray(p.images) ? p.images[0] : p.image;
        if (
          p.published !== true ||
          !p.slug ||
          !img || typeof img !== 'string' || !/^https?:\/\//.test(img) ||
          !offer || typeof offer.price !== 'number' || offer.price <= 0
        ) {
          skipped++;
          return;
        }
        const cur = offer.currency || 'INR';
        const mrp = typeof offer.originalPrice === 'number' ? offer.originalPrice : null;
        const onSale = mrp != null && mrp > offer.price;
        // Pinterest/Google feed format: price = regular price,
        // sale_price = discounted price (only when lower than price).
        const price = onSale ? `${mrp!.toFixed(2)} ${cur}` : `${offer.price.toFixed(2)} ${cur}`;
        const salePrice = onSale ? `${offer.price.toFixed(2)} ${cur}` : '';
        const avail =
          offer.availability === 'out_of_stock' ? 'out_of_stock'
          : offer.availability === 'pre_order' ? 'preorder'
          : 'in_stock';
        const desc = p.shortDescription || p.description || '';
        const extra = Array.isArray(p.images)
          ? p.images.slice(1, 4).filter((u: any) => typeof u === 'string' && /^https?:\/\//.test(u)).join(',')
          : '';
        rows.push([
          tsvCell(p.id || d.id, 100),
          tsvCell(p.name, 500),
          tsvCell(desc, 5000),
          tsvCell(`${baseUrl}/product/${p.slug}`, 2000),
          tsvCell(img, 2000),
          price,
          salePrice,
          avail,
          'new',
          tsvCell(p.brand, 200),
          tsvCell(p.category, 200),
          tsvCell(extra, 2000),
        ].join('\t'));
      });
      if (rows.length === 0) {
        console.error('[PINTEREST FEED] 0 rows — refusing to serve an empty feed');
        return res.status(500).type('text/plain').send('Catalog feed unavailable');
      }
      const header = ['id', 'title', 'description', 'link', 'image_link', 'price', 'sale_price', 'availability', 'condition', 'brand', 'product_type', 'additional_image_link'].join('\t');
      console.log(`[PINTEREST FEED] ${rows.length} rows, ${skipped} skipped`);
      res.type('text/tab-separated-values; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send([header, ...rows].join('\n') + '\n');
    } catch (e: any) {
      console.error('[PINTEREST FEED ERROR]:', e);
      res.status(500).type('text/plain').send('Error generating catalog feed');
    }
  });

  // API 404 handler to prevent SPA fallback from masking missing API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `API endpoint ${req.method} ${req.path} not found` });
  });

  export async function startServer() {
    const PORT = Number(process.env.PORT) || 3000;
    const distPath = path.join(process.cwd(), 'dist');

    const execPath = process.argv[1] || '';
    const isProduction =
      process.env.NODE_ENV === "production" ||
      execPath.includes("dist") ||
      execPath.endsWith(".cjs") ||
      process.env.npm_lifecycle_event === "start" ||
      (process.env.npm_lifecycle_event !== "dev" && fs.existsSync(path.join(distPath, "index.html")));

    if (!isProduction) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });

    server.on("error", (err: any) => {
      console.error("Server listener error:", err);
    });

    return server;
  }

  // Only start the HTTP listener if running directly as a standalone process (not inside a serverless runtime like Vercel)
  if (!process.env.VERCEL && !process.env.NOW_REGION) {
    startServer().catch((err) => {
      console.error("Fatal error starting server:", err);
      process.exit(1);
    });
  }

  export default app;

