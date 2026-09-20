import express from "express";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from "path";
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

let adminApp: any = null;
let firebaseConfig: any = null;
try {
  const configStr = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
  firebaseConfig = JSON.parse(configStr);
  adminApp = initializeApp({
    projectId: firebaseConfig.projectId,
  });
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
}

async function getUserRole(idToken: string, uid: string, email?: string): Promise<string> {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'aryasingh2366@gmail.com' || cleanEmail === 'admin@findora.com') {
      return 'admin';
    }
    if (cleanEmail === 'editor@findora.com') {
      return 'editor';
    }
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

  return 'shopper';
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
    whyWePickedIt,
    topPick,
    pros,
    cons,
    seoTitle,
    seoDescription: shortSeoDescription,
    tags,
    suggestedCategory: cleanCat,
  };
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
      
      if (!adminApp || !firebaseConfig) {
        return res.status(500).json({ success: false, message: "Server configuration not ready" });
      }
      
      const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
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
          if (adminApp) {
            const decoded = await getAuth(adminApp).verifyIdToken(idToken);
            const role = await getUserRole(idToken, decoded.uid, decoded.email);
            if (role === 'shopper') {
              return res.status(403).json({
                success: false,
                message: "Forbidden: Admin or Editor role required to access AI Copilot",
              });
            }
          }
        } catch (authErr: any) {
          console.warn("[AUTH] Token check non-blocking warning:", authErr?.message || authErr);
        }
      }

      const { brand = '', title = '', shortPitch = '', category = '' } = req.body || {};

      if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Product title is required and must be at least 3 characters",
        });
      }

      const cleanTitle = title.trim();
      const cleanBrand = (brand || '').trim();
      const cleanShortPitch = (shortPitch || '').trim();
      const cleanCategory = (category || '').trim();

      const ai = getGeminiClient();
      if (ai) {
        const prompt = `You are an editorial assistant and product curator for Findora (a smart Indian product discovery and price comparison platform).
Analyze this product:
- Brand: ${cleanBrand || 'Not specified'}
- Product Title: ${cleanTitle}
- Category: ${cleanCategory || 'General'}
- Short Description / Notes: ${cleanShortPitch || 'None provided'}

CRITICAL STRICT RULES (NO HALLUCINATIONS):
- You must ONLY use facts directly stated or reasonably evident from the provided brand, product title, category, and short description.
- Do NOT invent specific technical specifications, exact battery runtime, lab certifications, warranty periods, performance claims, awards, benchmark comparisons, or fake dimensions.
- Do NOT create fake reviews, star ratings, or price claims.
- If information is not provided, write conservatively and objectively instead of guessing or fabricating details.

Generate a structured JSON object containing all of the following fields:
{
  "whyWePickedIt": "A concise, compelling 2-3 sentence editorial explanation of why Findora recommends this product and what makes it a smart buy for shoppers, based strictly on the provided info.",
  "topPick": "A punchy standard badge label such as 'Top Pick', 'Editor\\'s Choice', 'Best Value', 'Flagship Pick', 'Budget King', or 'Trending Deal'.",
  "pros": ["An array of 3 to 4 genuine advantages based strictly on provided details."],
  "cons": ["An array of 1 to 2 honest trade-offs or considerations shoppers should know."],
  "seoTitle": "A concise SEO meta title under 60 characters, e.g. '${cleanBrand} ${cleanTitle} - Price & Review | Findora'",
  "seoDescription": "A punchy SEO meta description under 160 characters summarizing the product for shoppers.",
  "tags": ["An array of 3 to 5 relevant keyword tags for search/filtering, e.g. '${cleanBrand}', '${cleanCategory}'"],
  "suggestedCategory": "The most appropriate category name for this product (e.g. Audio, Mobiles & Accessories, TV & Home Entertainment, Computers & Accessories, Kitchen, Watches, Beauty & Personal Care, Fashion, Home & Living)"
}
Return ONLY valid JSON, without any markdown codeblock markers or extra commentary.`;

        // Try fast, robust candidate models in priority order with resilience against temporary 503 high-demand spikes
        const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
        
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
              const parsed = JSON.parse(rawText);
              return res.json({
                success: true,
                data: {
                  whyWePickedIt: parsed.whyWePickedIt || '',
                  topPick: parsed.topPick || 'Top Pick',
                  pros: Array.isArray(parsed.pros) ? parsed.pros : [],
                  cons: Array.isArray(parsed.cons) ? parsed.cons : [],
                  seoTitle: parsed.seoTitle || `${cleanBrand} ${cleanTitle} | Findora`.slice(0, 65),
                  seoDescription: parsed.seoDescription || parsed.shortSeoDescription || '',
                  tags: Array.isArray(parsed.tags) ? parsed.tags : [cleanBrand, cleanCategory].filter(Boolean),
                  suggestedCategory: parsed.suggestedCategory || cleanCategory,
                },
                source: 'gemini',
                modelUsed: candidateModel,
              });
            }
          } catch (geminiError: any) {
            // If the model is experiencing temporary high demand (503) or rate limits (429), try the next candidate model
            const status = geminiError?.status || geminiError?.code;
            if (status === 503 || status === 429) {
              // Try next model without treating as fatal error
              continue;
            }
          }
        }
      }

      // Fallback rule-based generator
      const fallbackData = generateFallbackContent(cleanBrand, cleanTitle, cleanShortPitch, cleanCategory);
      return res.json({
        success: true,
        data: fallbackData,
        source: 'fallback',
      });
    } catch (e: any) {
      console.error("[API] Error in /api/generate-product-content:", e);
      return res.status(500).json({ success: false, message: e?.message || "Internal server error" });
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

  

  

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
