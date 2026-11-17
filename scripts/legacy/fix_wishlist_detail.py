import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

replacement = """
  const handleWishlistToggle = () => {
    if (!store.getCurrentUser()) {
      showToast('Please log in to save to wishlist', 'info');
      onNavigate('/login');
      return;
    }
    const added = store.toggleWishlist(product.id);
    showToast(store.isInWishlist(product.id) ? `Saved ${product.name} to wishlist` : 'Removed from wishlist', 'info');
  };
"""

code = re.sub(r'const handleWishlistToggle = \(\) => \{[\s\S]*?\};\n', replacement.strip() + '\n', code)

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

print("done detail")
