import re

with open('src/components/common/ProductCard.tsx', 'r') as f:
    code = f.read()

replacement = """
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!store.getCurrentUser()) {
      showToast('Please log in to save to wishlist', 'info');
      if (onNavigate) onNavigate('/login');
      return;
    }
    const added = store.toggleWishlist(product.id);
    showToast(store.isInWishlist(product.id) ? `Added ${product.name} to wishlist` : 'Removed from wishlist', 'info');
  };
"""
code = re.sub(r'const handleWishlistToggle = \(e: React\.MouseEvent\) => \{[\s\S]*?\};\n', replacement.strip() + '\n', code)

with open('src/components/common/ProductCard.tsx', 'w') as f:
    f.write(code)

print("done card")
