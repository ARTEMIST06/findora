import re

with open('src/pages/public/ProfilePage.tsx', 'r') as f:
    code = f.read()

# Add state and useEffect for price alerts
state_old = """  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);

  useEffect(() => {
"""

state_new = """  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoadingAlerts(true);
      store.getPriceAlerts(currentUser.id).then(alerts => {
        setPriceAlerts(alerts);
        setLoadingAlerts(false);
      });
    }
  }, [currentUser]);"""

# Wait, `priceAlerts` is not even defined in ProfilePage right now.

imports_old = """import { useFindoraStore } from '../../services/store';"""
imports_new = """import { useState, useEffect } from 'react';\nimport { BellRing, CheckCircle } from 'lucide-react';\nimport { useFindoraStore } from '../../services/store';"""

if "useState" not in code:
    code = code.replace(imports_old, imports_new)
else:
    code = code.replace("import { useFindoraStore", "import { BellRing, CheckCircle } from 'lucide-react';\nimport { useFindoraStore")

state_logic = """  const { showToast } = useToast();

  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setLoadingAlerts(true);
      store.getPriceAlerts(currentUser.id).then(alerts => {
        // Hydrate with product info
        const products = store.getAllProductsWithPrices(true);
        const hydrated = alerts.map(a => {
           const prod = products.find(p => p.id === a.productId);
           return { ...a, product: prod };
        });
        setPriceAlerts(hydrated);
        setLoadingAlerts(false);
      });
    }
  }, [currentUser]);

  const handleDeleteAlert = async (id: string) => {
     setIsDeleting(id);
     const success = await store.deletePriceAlert(id);
     if (success) {
        setPriceAlerts(prev => prev.filter(a => a.id !== id));
        showToast('Price alert removed', 'success');
     } else {
        showToast('Failed to remove price alert', 'error');
     }
     setIsDeleting(null);
  };
"""

code = code.replace("  const { showToast } = useToast();", state_logic)

ui_logic = """
      {/* Price Alerts Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <BellRing className="w-5 h-5 text-blue-600" />
            <span>Your Price Alerts</span>
          </div>
        </div>
        <div className="pt-4">
          {loadingAlerts ? (
            <p className="text-sm text-slate-500 py-4">Loading alerts...</p>
          ) : priceAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceAlerts.map(alert => (
                <div key={alert.id} className={`p-4 border rounded-xl relative ${alert.isActive ? 'border-blue-100 bg-blue-50/30' : 'border-emerald-100 bg-emerald-50/30'}`}>
                  {alert.isActive ? (
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">Active</span>
                  ) : (
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Triggered
                    </span>
                  )}
                  
                  <div className="flex items-start gap-3 mt-2 cursor-pointer" onClick={() => alert.product && onNavigate(`/product/${alert.product.slug}`)}>
                    {alert.product?.images?.[0] ? (
                      <img src={alert.product.images[0]} alt={alert.product.name} className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{alert.product?.name || 'Unknown Product'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Target: <strong className="text-slate-900">₹{alert.targetPrice}</strong></p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">Created {new Date(alert.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAlert(alert.id); }}
                      disabled={isDeleting === alert.id}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                    >
                      {isDeleting === alert.id ? 'Removing...' : 'Remove Alert'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">You haven't set up any price alerts yet.</p>
          )}
        </div>
      </div>
"""

code = code.replace("      {/* Grid: Wishlist Overview & Outbound Click History */}", ui_logic + "\n      {/* Grid: Wishlist Overview & Outbound Click History */}")

with open('src/pages/public/ProfilePage.tsx', 'w') as f:
    f.write(code)
print("Patched ProfilePage")
