import React from 'react';
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

  const wishlistProducts = store.getWishlist();

  const handleRemove = (id: string, name: string) => {
    store.toggleWishlist(id);
    showToast(`Removed ${name} from wishlist`, 'info');
  };

  const handleCheckDeal = (product: (typeof wishlistProducts)[0]) => {
    if (product.offers.length > 0) {
      const best = product.offers[0];
      store.trackAffiliateClick(product.id, best.storeId, best.price, best.affiliateUrl);
      showToast(`Redirecting to ${product.bestStore?.name || 'merchant'}...`, 'info');
      window.open(best.affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(`/product/${product.slug}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <SEOHead 
        title="Your Wishlist - Findora"
        description="Monitor current lowest store prices for your favorite devices and buy when the time is right."
      />
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
          <Heart className="w-4 h-4 fill-rose-600" />
          <span>Personal Watchlist</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Your Saved Products ({wishlistProducts.length})
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor current lowest store prices for your favorite devices and buy when the time is right.
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your wishlist is empty</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Click the heart icon on any product or comparison card to save it for easy tracking.
          </p>
          <button
            onClick={() => onNavigate('/products')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Discover Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-contain rounded-xl bg-slate-50 p-1.5 border border-slate-100"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {product.brand}
                      </span>
                      <h3
                        onClick={() => onNavigate(`/product/${product.slug}`)}
                        className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(product.id, product.name)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Pricing row */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Lowest Price</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatINR(product.lowestPrice)}
                    </span>
                  </div>
                  {product.bestStore && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      {product.bestStore.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate(`/product/${product.slug}`)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold text-center"
                >
                  All {product.offers.length} Offers
                </button>
                <button
                  onClick={() => handleCheckDeal(product)}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-xs"
                >
                  <span>Go to Deal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
