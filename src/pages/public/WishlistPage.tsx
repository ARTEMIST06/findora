import React, { useEffect } from 'react';
import { Heart, Trash2, ExternalLink, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
import { formatINR } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';

interface WishlistPageProps {
  onNavigate: (route: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (!store.isAuthLoading() && !store.getCurrentUser()) {
      onNavigate('/login');
    }
  }, [store.isAuthLoading(), store.getCurrentUser()]);

  if (store.isAuthLoading()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!store.getCurrentUser()) return null;

  const wishlistProducts = store.getWishlist();

  const handleRemove = (id: string, name: string) => {
    store.toggleWishlist(id);
    showToast(`Removed ${name} from wishlist`, 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <SEOHead 
        title="Your Wishlist - Findora"
        description="Monitor current lowest store prices for your favorite devices and buy when the time is right."
      />
      <div className="pb-6 border-b border-slate-800/80">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-widest mb-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
          <span>Personal Watchlist</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Your Saved Products ({wishlistProducts.length})
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor current lowest store prices for your favorite devices and buy when the time is right.
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="text-center py-24 bg-[#0D1322]/80 rounded-3xl border border-slate-800/80 p-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
            Click the heart icon on any product or comparison card to save it for easy tracking.
          </p>
          <button
            onClick={() => onNavigate('/products')}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            Discover Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="p-6 rounded-3xl bg-[#0D1322]/90 border border-slate-800/80 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#080D1A] p-2 border border-slate-800 flex items-center justify-center shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        {product.brand}
                      </span>
                      <h3
                        onClick={() => onNavigate(`/product/${product.slug}`)}
                        className="text-xs sm:text-sm font-bold text-white line-clamp-2 hover:text-blue-400 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(product.id, product.name)}
                    className="p-1.5 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Pricing row */}
                <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Lowest Price</span>
                    <span className="text-base font-extrabold text-white">
                      {formatINR(product.lowestPrice)}
                    </span>
                  </div>
                  {product.bestStore && (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      {product.bestStore.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onNavigate(`/product/${product.slug}`)}
                  className="w-full py-2.5 px-3 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-all"
                >
                  All {product.offers.length} Offers
                </button>
                {product.offers.length > 0 && product.offers[0].affiliateUrl ? (
                  <a
                    href={product.offers[0].affiliateUrl.startsWith('http') ? product.offers[0].affiliateUrl : `https://${product.offers[0].affiliateUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => store.trackAffiliateClick(product.id, product.offers[0].storeId, product.offers[0].price, product.offers[0].affiliateUrl)}
                    className="w-full py-2.5 px-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
                  >
                    <span>Check Price</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => showToast('Merchant link unavailable.', 'error')}
                    className="w-full py-2.5 px-3 rounded-full bg-slate-800 text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-700"
                  >
                    <span>Unavailable</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
