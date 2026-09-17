import express from "express";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from "path";
import { createServer as createViteServer } from "vite";
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

dotenv.config();






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

  // --- DRAFT PUBLISH API ---

  app.post("/api/publish-draft", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await getAuth(adminApp).verifyIdToken(token);
      const uid = decodedToken.uid;

      // Verify User Role
      
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return res.status(403).json({ success: false, message: "User not found" });
      }
      const role = userDoc.data()?.role;
      if (role !== "admin" && role !== "editor") {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
      }

      const { draft } = req.body;
      if (!draft || !draft.id) {
        return res.status(400).json({ success: false, message: "Draft data required" });
      }

      // Server-side validation
      const requiredFields = [
        'title', 'brand', 'category', 'merchantId', 'productUrl', 
        'image', 'currentPrice', 'availability', 'affiliateUrl'
      ];
      
      const missingFields = requiredFields.filter(f => {
        const val = draft[f];
        return val === null || val === undefined || val === '' || Number.isNaN(val);
      });

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      const productId = `prod_${Date.now()}`;
      const offerId = `off_${Date.now()}`;

      const product = {
        id: productId,
        slug: draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
        name: draft.title,
        brand: draft.brand,
        category: draft.category,
        shortDescription: (draft.shortPitch || '').replace('[AI suggestion — review before saving]', '').trim(),
        description: (draft.whyFindora || '').replace('[AI suggestion — review before saving]', '').trim(),
        images: [draft.image],
        specifications: draft.specifications || {},
        pros: draft.pros || [],
        cons: draft.cons || [],
        whyFindora: (draft.whyFindora || '').replace('[AI suggestion — review before saving]', '').trim(),
        tags: [],
        published: true,
        featured: draft.featured || false,
        badge: draft.badge || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const offer = {
        id: offerId,
        productId,
        storeId: draft.merchantId,
        price: draft.currentPrice,
        originalPrice: draft.mrp || draft.currentPrice,
        currency: 'INR',
        affiliateUrl: draft.affiliateUrl,
        availability: draft.availability,
        lastUpdated: new Date().toISOString(),
        sourceType: 'manual',
        merchantProductId: draft.merchantProductId || '',
        productUrl: draft.productUrl || ''
      };

      const finalDraft = {
        ...draft,
        draftStatus: 'published',
        published: true,
        publishedAt: new Date().toISOString(),
        publishedBy: uid,
        updatedAt: new Date().toISOString()
      };

      const batch = adminDb.batch();
      
      batch.set(adminDb.collection("products").doc(productId), product);
      batch.set(adminDb.collection("offers").doc(offerId), offer);
      batch.set(adminDb.collection("productDrafts").doc(draft.id), finalDraft, { merge: true });
      
      await batch.commit();

      res.json({ success: true, message: "Draft published successfully!" });
    } catch (error) {
      console.error("[SERVER] Publish draft error:", error);
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
