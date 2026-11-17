import re

with open('src/pages/public/WishlistPage.tsx', 'r') as f:
    code = f.read()

replacement = """
  useEffect(() => {
    if (!store.isAuthLoading() && !store.getCurrentUser()) {
      onNavigate('/login');
    }
  }, [store.isAuthLoading(), store.getCurrentUser()]);

  if (store.isAuthLoading()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!store.getCurrentUser()) return null;

  const wishlistProducts = store.getWishlist();
"""

code = code.replace("  const wishlistProducts = store.getWishlist();", replacement.strip())

with open('src/pages/public/WishlistPage.tsx', 'w') as f:
    f.write(code)

print("done wishlist page")
