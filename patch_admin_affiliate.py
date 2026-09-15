import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Update handleFetchProduct to also capture affiliateUrl
replacement = """
                productUrl: resData.productUrl || fetchUrl,
                affiliateUrl: resData.affiliateUrl || newOffers[0].affiliateUrl,
                merchantProductId: resData.merchantProductId || newOffers[0].merchantProductId,
                syncStatus: 'manual'
"""
code = code.replace("""
                productUrl: resData.productUrl || fetchUrl,
                merchantProductId: resData.merchantProductId || newOffers[0].merchantProductId,
                syncStatus: 'manual'
""", replacement.strip() + "\n")

# Update fetchedFields state for affiliateUrl
code = code.replace("""
           productUrl: !!resData.productUrl,
""", """
           productUrl: !!resData.productUrl,
           affiliateUrl: !!resData.affiliateUrl,
""")

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("done patching admin affiliate")
