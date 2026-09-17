import re
with open("server.ts", "r") as f:
    content = f.read()

endpoint = """
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
"""
content = content.replace("  // --- DRAFT PUBLISH API ---", endpoint)
with open("server.ts", "w") as f:
    f.write(content)
