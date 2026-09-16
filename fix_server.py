import re

with open("server.ts", "r") as f:
    content = f.read()

publish_api = """
  // --- DRAFT PUBLISH API ---
  app.post("/api/publish-draft", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await getAuth().verifyIdToken(token);
      const uid = decodedToken.uid;

      // Verify User Role
      const adminDb = getFirestore();
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
        return val === null || val === undefined || val === '';
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

  app.post("/api/fetch-product", fetchProductLimiter, async (req, res) => {
"""

content = content.replace('  app.post("/api/fetch-product", fetchProductLimiter, async (req, res) => {', publish_api)

with open("server.ts", "w") as f:
    f.write(content)
