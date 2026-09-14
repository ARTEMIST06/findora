import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Replace handleSaveProduct with async version
code = code.replace(
    "const handleSaveProduct = (e: React.FormEvent) => {",
    "const handleSaveProduct = async (e: React.FormEvent) => {"
)
code = code.replace(
    "store.updateProduct(editingProduct.id,",
    "await store.updateProduct(editingProduct.id,"
)
code = code.replace(
    "const newProd = store.addProduct(",
    "const newProd = await store.addProduct("
)
code = code.replace(
    "editingProductOffers.forEach(offer => {",
    "for (const offer of editingProductOffers) {"
)
# We need to replace the inner return with continue inside the loop
code = code.replace(
    "if (!offer.storeId || !offer.price || offer.price <= 0 || !offer.affiliateUrl) return; // Skip invalid",
    "if (!offer.storeId || !offer.price || offer.price <= 0 || !offer.affiliateUrl) continue; // Skip invalid"
)
code = code.replace(
    "store.updatePriceOffer(offer.id,",
    "await store.updatePriceOffer(offer.id,"
)
code = code.replace(
    "store.addPriceOffer({",
    "await store.addPriceOffer({"
)
code = code.replace(
    "});\n    }\n\n    setIsProductModalOpen(false);",
    "}\n    }\n\n    setIsProductModalOpen(false);"
)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)
print("done admin")
