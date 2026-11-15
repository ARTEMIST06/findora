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
        <div className="w-10 h-10 border-4 border-slate-200 border-t-black rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authenticating...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center bg-white border border-slate-200 rounded-none p-8 my-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
        <p className="text-sm text-slate-600 mb-6">
          Please sign in to view your profile, alerts, and saved products.
        </p>
        <button
          onClick={() => onNavigate('/login')}
          className="w-full py-3 bg-black hover:bg-slate-800 text-white font-semibold text-xs rounded-full shadow-md shadow-black/10"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <SEOHead 
        title="Your Profile | Findora"
        description="Manage your account, view your wishlist, and track your recent store visits on Findora."
        canonicalPath="/profile"
        noIndex={true}
      />
      {/* User Header Card */}
      <div className="p-6 sm:p-8 rounded-none bg-white/90 border border-slate-200/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-center gap-5">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-none object-cover ring-4 ring-black/20 border border-slate-300"
            />
          ) : (
            <div className="w-16 h-16 rounded-none bg-gradient-to-tr from-black to-black text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-black/10">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-black/10 text-black border border-black/20">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{currentUser.email}</p>
            {currentUser.createdAt && (
              <p className="text-[10px] text-slate-600 mt-1">Joined {new Date(currentUser.createdAt).toLocaleDateString()}</p>
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
          className="text-xs font-semibold text-black hover:text-black flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/20 hover:bg-black/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Admin Quick Jump Banner */}
      {currentUser.role === 'admin' && (
        <div className="p-6 rounded-none bg-black border border-black/20 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
              <LayoutDashboard className="w-5 h-5 text-black" />
              <span>Admin Dashboard Access Granted</span>
            </h3>
            <p className="text-xs text-slate-700 mt-1">
              You can manage products, store offers, price updates, affiliate links, and analytics.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/admin')}
            className="px-6 py-2.5 bg-black text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-all shrink-0 shadow-md shadow-black/10"
          >
            Launch Admin Panel →
          </button>
        </div>
      )}

      {/* Price Alerts Section */}
      <div className="bg-white/90 border border-slate-200/80 rounded-none p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <BellRing className="w-5 h-5 text-black" />
            <span>Your Price Alerts</span>
          </div>
        </div>
        <div className="pt-5">
          {loadingAlerts ? (
            <p className="text-sm text-slate-600 py-4">Loading alerts...</p>
          ) : priceAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceAlerts.map((alert) => (
                <div key={alert.id} className={`p-5 border rounded-none relative ${alert.isActive ? 'border-black/20 bg-black/5' : 'border-black/20 bg-white0/5'}`}>
                  {alert.isActive ? (
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-black bg-black/10 border border-black/20 px-2.5 py-0.5 rounded-full">Active</span>
                  ) : (
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-black bg-black/10 border border-black/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Triggered
                    </span>
                  )}
                  
                  <div className="flex items-start gap-3 mt-1 cursor-pointer" onClick={() => alert.product && onNavigate(`/product/${alert.product.slug}`)}>
                    {alert.product?.images?.[0] ? (
                      <img src={alert.product.images[0]} alt={alert.product.name} className="w-12 h-12 object-contain bg-white rounded-xl border border-slate-200 p-1" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-300"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{alert.product?.name || 'Unknown Product'}</h4>
                      <p className="text-xs text-slate-600 mt-1">Target: <strong className="text-slate-900">₹{alert.targetPrice}</strong></p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200/80">
                    <span className="text-[10px] text-slate-600">Created {new Date(alert.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAlert(alert.id); }}
                      disabled={isDeleting === alert.id}
                      className="text-xs font-semibold text-black hover:text-black disabled:opacity-50"
                    >
                      {isDeleting === alert.id ? 'Removing...' : 'Remove Alert'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 py-6 text-center">You haven't set up any price alerts yet.</p>
          )}
        </div>
      </div>

      {/* Grid: Wishlist Overview & Outbound Click History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wishlist Box */}
        <div className="p-6 sm:p-7 rounded-none bg-white/90 border border-slate-200/80 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Heart className="w-4 h-4 text-black" />
              <span>Saved in Wishlist ({wishlist.length})</span>
            </div>
            <button
              onClick={() => onNavigate('/wishlist')}
              className="text-xs text-black hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto scrollbar-thin">
            {wishlist.length > 0 ? (
              wishlist.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onNavigate(`/product/${prod.slug}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-100/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-10 h-10 object-contain rounded-lg p-1 bg-white border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {prod.name}
                      </h4>
                      <span className="text-xs font-bold text-black">
                        {formatINR(prod.lowestPrice)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-600">View</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 py-4 text-center">No saved items yet.</p>
            )}
          </div>
        </div>

        {/* Affiliate Outbound Click Tracking History */}
        <div className="p-6 sm:p-7 rounded-none bg-white/90 border border-slate-200/80 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <History className="w-4 h-4 text-black" />
              <span>Store Link Visits ({clicks.length})</span>
            </div>
            <span className="text-[11px] text-slate-600">Transparency log</span>
          </div>

          <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto scrollbar-thin">
            {clicks.length > 0 ? (
              clicks.slice(0, 5).map((click) => (
                <div key={click.id} className="py-3 flex items-center justify-between gap-3 text-xs px-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 line-clamp-1">
                      {click.productName}
                    </h4>
                    <span className="text-slate-600">
                      Visited <strong className="text-slate-800">{click.storeName}</strong> • {formatINR(click.price)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {formatRelativeTime(click.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 py-4 text-center">No outbound store visits logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
