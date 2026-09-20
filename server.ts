import express from "express";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from "path";
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Firestore } from '@google-cloud/firestore';
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
  adminDb = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
  });
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
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

  const whyWePickedIt = `Findora selected the ${cleanTitle} by ${cleanBrand} because it strikes an outstanding balance between premium build quality and everyday value in the ${cleanCat} space. We actively track live price drops to ensure you secure the most competitive deal available.`;

  const shortSeoDescription = `${cleanTitle} from ${cleanBrand} combines dependable everyday performance with exceptional value in ${cleanCat}.`;

  const pros = [
    `Trusted craftsmanship and design from ${cleanBrand}`,
    `Excellent feature-to-price ratio in the ${cleanCat} segment`,
    `Positive consumer sentiment and high verified satisfaction`,
    `Seamless everyday reliability with proven durability`,
  ];

  const cons = [
    `Pricing can fluctuate frequently across online retailer sales`,
    `Verify technical dimensions and specifications before purchasing`,
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

  return {
    whyWePickedIt,
    topPick,
    pros,
    cons,
    shortSeoDescription,
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



  app.post("/api/generate-product-content", async (req, res) => {
    try {
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
        const prompt = `You are a product curator and deal editor for Findora (a smart Indian product discovery and price comparison platform).
Analyze this product:
- Brand: ${cleanBrand || 'Not specified'}
- Title: ${cleanTitle}
- User Notes / Description: ${cleanShortPitch || 'None'}
- Category: ${cleanCategory || 'General'}

Generate a structured JSON object containing all of the following fields:
{
  "whyWePickedIt": "A concise, compelling 2-3 sentence editorial explanation of why Findora recommends this product and what makes it a smart buy for shoppers.",
  "topPick": "A punchy badge label such as 'Top Pick', 'Editor\\'s Choice', 'Best Value', 'Flagship Pick', or 'Budget King'.",
  "pros": ["An array of 3 to 4 specific, genuine advantages of this product."],
  "cons": ["An array of 1 to 2 honest trade-offs or considerations shoppers should know."],
  "shortSeoDescription": "A punchy 1-sentence product summary (25-45 words).",
  "suggestedCategory": "The most appropriate category name for this product (e.g., Electronics, Home & Kitchen, Audio, Beauty, etc.)"
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
                  shortSeoDescription: parsed.shortSeoDescription || '',
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
      const snapshot = await adminDb.collection("products").get();
      const products = [];
      snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
      res.json(products);
    } catch(e) {
      res.status(500).json({error: e.toString()});
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
