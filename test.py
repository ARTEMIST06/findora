import re

with open('src/components/common/ProductCard.tsx', 'r') as f:
    code = f.read()

match = re.search(r'const handleWishlistToggle = \(e: React\.MouseEvent\) => \{([\s\S]*?)\};', code)
if match:
    print(match.group(0))

