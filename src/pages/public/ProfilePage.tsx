import React from 'react';
import {
  User,
  Shield,
  Heart,
  Scale,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useState, useEffect } from 'react';
import { BellRing, CheckCircle } from 'lucide-react';
import { useFindoraStore } from '../../services/store';
import { formatINR, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';

interface ProfilePageProps {
  onNavigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const currentUser = store.getCurrentUser();
  const authLoading = store.isAuthLoading();
  const wishlist = store.getWishlist();
  const clicks = store.getAffiliateClicks();
  const { showToast } = useToast();

  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setLoadingAlerts(true);
      store.getPriceAlerts(currentUser.id).then((alerts) => {
        // Hydrate with product info
        const products = store.getAllProductsWithPrices(true);
        const hydrated = alerts.map((a) => {
          const prod = products.find((p) => p.id === a.productId);
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
      setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
      showToast('Price alert removed', 'success');
    } else {
      showToast('Failed to remove price alert', 'error');
    }
    setIsDeleting(null);
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-white mb-2">Authenticating...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center bg-[#0D1322] border border-slate-800 rounded-3xl p-8 my-10">
        <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
        <p className="text-sm text-slate-400 mb-6">
          Please sign in to view your profile, alerts, and saved products.
        </p>
        <button
          onClick={() => onNavigate('/login')}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-full shadow-md shadow-indigo-500/20"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <SEOHead 
        title="Your Profile - Findora"
        description="Manage your account, view your wishlist, and track your recent store visits on Findora."
      />
      {/* User Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1322]/90 border border-slate-800/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-center gap-5">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500/20 border border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{currentUser.email}</p>
            {currentUser.createdAt && (
              <p className="text-[10px] text-slate-500 mt-1">Joined {new Date(currentUser.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        <button
          onClick={async () => {
            if (currentUser) await store.logSecurityEvent(currentUser.id, 'logout');
            store.logout();
            showToast('Successfully signed out', 'success');
            onNavigate('/');
          }}
          className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Admin Quick Jump Banner */}
      {currentUser.role === 'admin' && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-blue-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-white">
              <LayoutDashboard className="w-5 h-5 text-cyan-400" />
              <span>Admin Dashboard Access Granted</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              You can manage products, store offers, price updates, affiliate links, and analytics.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/admin')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shrink-0 shadow-md shadow-indigo-500/20"
          >
            Launch Admin Panel →
          </button>
        </div>
      )}

      {/* Price Alerts Section */}
      <div className="bg-[#0D1322]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <BellRing className="w-5 h-5 text-blue-400" />
            <span>Your Price Alerts</span>
          </div>
        </div>
        <div className="pt-5">
          {loadingAlerts ? (
            <p className="text-sm text-slate-400 py-4">Loading alerts...</p>
          ) : priceAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceAlerts.map((alert) => (
                <div key={alert.id} className={`p-5 border rounded-2xl relative ${alert.isActive ? 'border-blue-500/30 bg-blue-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                  {alert.isActive ? (
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 rounded-full">Active</span>
                  ) : (
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Triggered
                    </span>
                  )}
                  
                  <div className="flex items-start gap-3 mt-1 cursor-pointer" onClick={() => alert.product && onNavigate(`/product/${alert.product.slug}`)}>
                    {alert.product?.images?.[0] ? (
                      <img src={alert.product.images[0]} alt={alert.product.name} className="w-12 h-12 object-contain bg-[#080D1A] rounded-xl border border-slate-800 p-1" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white line-clamp-1">{alert.product?.name || 'Unknown Product'}</h4>
                      <p className="text-xs text-slate-400 mt-1">Target: <strong className="text-white">₹{alert.targetPrice}</strong></p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Created {new Date(alert.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAlert(alert.id); }}
                      disabled={isDeleting === alert.id}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-50"
                    >
                      {isDeleting === alert.id ? 'Removing...' : 'Remove Alert'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">You haven't set up any price alerts yet.</p>
          )}
        </div>
      </div>

      {/* Grid: Wishlist Overview & Outbound Click History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wishlist Box */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0D1322]/90 border border-slate-800/80 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Saved in Wishlist ({wishlist.length})</span>
            </div>
            <button
              onClick={() => onNavigate('/wishlist')}
              className="text-xs text-blue-400 hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto scrollbar-thin">
            {wishlist.length > 0 ? (
              wishlist.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onNavigate(`/product/${prod.slug}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-10 h-10 object-contain rounded-lg p-1 bg-[#080D1A] border border-slate-800"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">
                        {prod.name}
                      </h4>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatINR(prod.lowestPrice)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">View</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No saved items yet.</p>
            )}
          </div>
        </div>

        {/* Affiliate Outbound Click Tracking History */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0D1322]/90 border border-slate-800/80 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <History className="w-4 h-4 text-blue-400" />
              <span>Store Link Visits ({clicks.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">Transparency log</span>
          </div>

          <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto scrollbar-thin">
            {clicks.length > 0 ? (
              clicks.slice(0, 5).map((click) => (
                <div key={click.id} className="py-3 flex items-center justify-between gap-3 text-xs px-2">
                  <div>
                    <h4 className="font-semibold text-white line-clamp-1">
                      {click.productName}
                    </h4>
                    <span className="text-slate-400">
                      Visited <strong className="text-slate-200">{click.storeName}</strong> • {formatINR(click.price)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {formatRelativeTime(click.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No outbound store visits logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
