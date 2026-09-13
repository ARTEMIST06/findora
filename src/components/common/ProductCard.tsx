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
    const added = store.toggleWishlist(product.id);
    showToast(added ? `Added ${product.name} to wishlist` : 'Removed from wishlist', 'info');
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

  const handleCheckPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.offers.length > 0) {
      const bestOffer = product.offers[0];
      if (!bestOffer.affiliateUrl) {
        showToast('Offer link is currently unavailable.', 'error');
        return;
      }
      store.trackAffiliateClick(
        product.id,
        bestOffer.storeId,
        bestOffer.price,
        bestOffer.affiliateUrl
      );
      showToast(`Redirecting to ${product.bestStore?.name || 'store offer'}...`, 'info');
      // In real scenario opens affiliateUrl in new tab
      window.open(bestOffer.affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(`/product/${product.slug}`);
    }
  };

  const mainImage = product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';

  return (
    <div
      onClick={() => onNavigate(`/product/${product.slug}`)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
      id={`product-card-${product.id}`}
    >
      {/* Top Badges & Quick Action Overlay */}
      <div className="relative aspect-square w-full bg-slate-50/70 p-4 flex items-center justify-center overflow-hidden">
        {/* Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-900 text-white shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {product.badge}
            </span>
          )}
          {product.maxDiscountPercent && product.maxDiscountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
              <Tag className="w-3 h-3" />
              Save {product.maxDiscountPercent}%
            </span>
          )}
        </div>

        {/* Quick action buttons (Wishlist, Compare) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-xl transition-all shadow-xs backdrop-blur-md ${
              isWishlisted
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-white/90 text-slate-500 hover:text-rose-600 hover:bg-white border border-slate-200/70'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
          </button>

          <button
            onClick={handleCompareToggle}
            className={`p-2 rounded-xl transition-all shadow-xs backdrop-blur-md ${
              isCompared
                ? 'bg-blue-50 text-blue-600 border border-blue-200 ring-2 ring-blue-500/20'
                : 'bg-white/90 text-slate-500 hover:text-blue-600 hover:bg-white border border-slate-200/70'
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
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
        />

        {/* Store Offers count badge */}
        {product.offers.length > 1 && (
          <div className="absolute bottom-2.5 left-3 px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs border border-slate-200 text-[11px] font-medium text-slate-600">
            Compare <strong className="text-slate-900">{product.offers.length} stores</strong>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-slate-700">
            <span className="font-semibold uppercase tracking-wider">{product.brand}</span>
            {product.rating && (
              <span className="flex items-center gap-1 font-medium text-amber-600">
                ★ {product.rating} <span className="text-slate-600">({product.reviewCount})</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-slate-700 line-clamp-2 mt-1.5 font-normal">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Best Offer Highlight */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xs text-slate-700 block font-medium">Lowest Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-slate-950">
                  {formatINR(product.lowestPrice)}
                </span>
                {product.offers[0]?.originalPrice && product.offers[0].originalPrice > (product.lowestPrice || 0) && (
                  <span className="text-xs text-slate-700 line-through font-medium">
                    {formatINR(product.offers[0].originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {product.bestStore && (
              <div className="text-right">
                <span className="text-[11px] text-slate-700 block">Best at</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {product.bestStore.name}
                </span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(`/product/${product.slug}`);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors text-center"
            >
              All Prices ({product.offers.length})
            </button>
            <button
              onClick={handleCheckPrice}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Check Deal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
