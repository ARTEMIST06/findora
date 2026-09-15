import React from 'react';
import { Heart, Scale, ExternalLink, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { ProductWithPrices } from '../../types';
import { formatINR } from '../../utils/formatters';
import { useFindoraStore } from '../../services/store';
import { useToast } from './Toast';

interface ProductCardProps {
  product: ProductWithPrices;
  onNavigate: (route: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();

  const isWishlisted = store.isInWishlist(product.id);
  const isCompared = store.isInCompare(product.id);

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

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompared) {
      store.removeFromCompare(product.id);
      showToast('Removed from comparison', 'info');
    } else {
      const added = store.addToCompare(product.id);
      if (added) {
        showToast('Added to comparison (Max 4 items)', 'success');
      } else {
        showToast('Comparison limit reached (Max 4 items). Remove an item to add another.', 'error');
      }
    }
  };

  
  const mainImage = product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';

  return (
    <div
      onClick={() => onNavigate(`/product/${product.slug}`)}
      className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
      id={`product-card-${product.id}`}
    >
      {/* Top Badges & Quick Action Overlay */}
      <div className="relative aspect-square w-full bg-white p-6 flex items-center justify-center overflow-hidden">
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-900 text-white shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {product.badge}
            </span>
          )}
          {product.maxDiscountPercent && product.maxDiscountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-600 text-white shadow-sm">
              <Tag className="w-3 h-3" />
              Save {product.maxDiscountPercent}%
            </span>
          )}
        </div>

        {/* Quick action buttons (Wishlist, Compare) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-full transition-all shadow-sm backdrop-blur-md ${
              isWishlisted
                ? 'bg-rose-50 text-rose-600 border border-rose-200 opacity-100'
                : 'bg-white/90 text-slate-500 hover:text-rose-600 hover:bg-white border border-slate-200'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
          </button>

          <button
            onClick={handleCompareToggle}
            className={`p-2 rounded-full transition-all shadow-sm backdrop-blur-md ${
              isCompared
                ? 'bg-blue-50 text-blue-600 border border-blue-200 ring-2 ring-blue-500/20 opacity-100'
                : 'bg-white/90 text-slate-500 hover:text-blue-600 hover:bg-white border border-slate-200'
            }`}
            title={isCompared ? 'Remove from compare' : 'Add to compare'}
            aria-label="Compare"
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>

        {/* Product Image with smooth hover scale */}
        <img
          src={mainImage}
          alt={product.name}
          className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Store Offers count badge */}
        {product.offers.length > 1 && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] font-medium text-slate-600 shadow-sm">
            Compare <strong className="text-slate-900">{product.offers.length} stores</strong>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-slate-50/50">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider">{product.brand}</span>
            {product.rating && (
              <span className="flex items-center gap-1 font-medium text-amber-600">
                ★ {product.rating} <span className="text-slate-400">({product.reviewCount})</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price & Best Offer Highlight */}
        <div className="pt-4 mt-3 border-t border-slate-200/70 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider mb-0.5">Lowest Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-sm text-slate-400">Unavailable</span>}
                </span>
                {product.offers[0]?.originalPrice && product.offers[0].originalPrice > (product.lowestPrice || 0) && (
                  <span className="text-xs text-slate-400 line-through font-medium">
                    {formatINR(product.offers[0].originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {product.bestStore && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-0.5">Best at</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {product.bestStore.name}
                </span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 pt-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(`/product/${product.slug}`);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors text-center shadow-sm bg-white"
            >
              Details
            </button>
            {product.offers.length > 0 && product.offers[0].affiliateUrl ? (
              <a
                href={product.offers[0].affiliateUrl.startsWith('http') ? product.offers[0].affiliateUrl : `https://${product.offers[0].affiliateUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  store.trackAffiliateClick(
                    product.id,
                    product.offers[0].storeId,
                    product.offers[0].price,
                    product.offers[0].affiliateUrl
                  );
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Check Price</span>
              </a>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.offers.length > 0 && !product.offers[0].affiliateUrl) {
                    showToast('Merchant link unavailable', 'error');
                  } else {
                    onNavigate(`/product/${product.slug}`);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>View Details</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
