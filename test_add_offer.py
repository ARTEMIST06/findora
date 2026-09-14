import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Fix handleOpenNewProduct
code = code.replace("setIsProductModalOpen(true);", "setEditingProductOffers([{ storeId: '', price: 0, originalPrice: 0, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' }]);\n    setIsProductModalOpen(true);", 1)

# Fix handleEditProduct (already done? let's check)

# Fix onChange mutations
code = re.sub(
    r'const newOffers = \[\.\.\.editingProductOffers\];\s*newOffers\[idx\]\.(\w+) = e\.target\.value( as any)?;\s*setEditingProductOffers\(newOffers\);',
    r'const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], \1: e.target.value \2 }; setEditingProductOffers(newOffers);',
    code
)
code = re.sub(
    r'const newOffers = \[\.\.\.editingProductOffers\];\s*newOffers\[idx\]\.(\w+) = Number\(e\.target\.value\);\s*setEditingProductOffers\(newOffers\);',
    r'const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], \1: Number(e.target.value) }; setEditingProductOffers(newOffers);',
    code
)


with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)
print("done")
