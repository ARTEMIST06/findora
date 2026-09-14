import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Fix the syntax error
code = code.replace(
"""                {bestOffer && (
                  {bestOffer.affiliateUrl ? (""",
"""                {bestOffer && (
                  bestOffer.affiliateUrl ? ("""
)

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

print("fixed syntax")
