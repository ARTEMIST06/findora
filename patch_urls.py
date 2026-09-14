import re

def fix_file(filepath, pattern, replacement):
    with open(filepath, 'r') as f:
        code = f.read()
    code = code.replace(pattern, replacement)
    with open(filepath, 'w') as f:
        f.write(code)

# Fix ProductDetailPage.tsx
old_pdp = "window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');"
new_pdp = """const url = offer.affiliateUrl.startsWith('http') ? offer.affiliateUrl : `https://${offer.affiliateUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');"""
fix_file('src/pages/public/ProductDetailPage.tsx', old_pdp, new_pdp)

# Fix ProductCard.tsx
old_pc = "window.open(bestOffer.affiliateUrl, '_blank', 'noopener,noreferrer');"
new_pc = """const url = bestOffer.affiliateUrl.startsWith('http') ? bestOffer.affiliateUrl : `https://${bestOffer.affiliateUrl}`;
      window.open(url, '_blank', 'noopener,noreferrer');"""
fix_file('src/components/common/ProductCard.tsx', old_pc, new_pc)

