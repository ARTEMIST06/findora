import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# We need to move the early returns DOWN, below all the hooks.
# Or move the hooks UP, above all the early returns.

# Let's find the hooks chunk:
hooks_chunk = """  // Active admin tab
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'offers' | 'stores' | 'clicks'>(
    'overview'
  );

  // Search & filter in tables
  const [productFilter, setProductFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingProductOffers, setEditingProductOffers] = useState<Partial<PriceOffer>[]>([]);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<PriceOffer> | null>(null);
  const [targetProductIdForOffer, setTargetProductIdForOffer] = useState<string>('');

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Partial<StoreType> | null>(null);"""

early_returns_chunk = """  const authLoading = store.isAuthLoading();
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authenticating...</h2>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Authentication Required</h2>
        <p className="text-slate-500 mb-6">You must be logged in to access the admin dashboard.</p>
        <button
          onClick={() => onNavigate('/login')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <XCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-6">Your account does not have permission to access the admin area.</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }"""

if early_returns_chunk in code and hooks_chunk in code:
    code = code.replace(hooks_chunk, "")
    code = code.replace(early_returns_chunk, hooks_chunk + "\n\n" + early_returns_chunk)
    with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
        f.write(code)
    print("Fixed hooks order")
else:
    print("Chunks not found")
