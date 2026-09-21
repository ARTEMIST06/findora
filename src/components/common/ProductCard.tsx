import React from 'react';
import { Heart, Scale, ExternalLink, ShieldCheck, Tag, Sparkles, Star } from 'lucide-react';
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

  const mainImage = (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';

  // Determine badge styling based on badge content
  const getBadgeStyle = (badgeText?: string, discount?: number) => {
    if (badgeText?.toLowerCase().includes('value') || badgeText?.toLowerCase().includes('editor')) {
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
    if (badgeText?.toLowerCase().includes('trend') || badgeText?.toLowerCase().includes('choice')) {
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
    }
    if (discount && discount > 20) {
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
    }
    return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
  };

  return (
    <div
      onClick={() => onNavigate(`/product/${product.slug}`)}
      className="group relative bg-[#0D1322]/90 hover:bg-[#121B30] rounded-2xl border border-slate-800/80 hover:border-blue-500/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer backdrop-blur-sm"
      id={`product-card-${product.id}`}
    >
      {/* Top Image Stage */}
      <div className="relative aspect-square w-full bg-[#080D1A] p-5 flex items-center justify-center overflow-hidden border-b border-slate-800/60">
        {/* Ambient Backlight Glow */}
        <div className="absolute inset-0 product-backdrop-glow pointer-events-none"></div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md backdrop-blur-md ${getBadgeStyle(
                product.badge
              )}`}
            >
              <Sparkles className="w-3 h-3" />
              {product.badge}
            </span>
          )}
          {product.maxDiscountPercent && product.maxDiscountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600/90 text-white shadow-md border border-blue-400/30 backdrop-blur-md">
              <Tag className="w-3 h-3" />
              {product.maxDiscountPercent}% OFF
            </span>
          )}
        </div>

        {/* Top Right Quick Actions (Wishlist & Compare) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-full transition-all shadow-md backdrop-blur-md ${
              isWishlisted
                ? 'bg-rose-500/30 text-rose-400 border border-rose-500/60'
                : 'bg-black/40 text-slate-300 hover:text-rose-400 hover:bg-black/70 border border-white/10 opacity-80 group-hover:opacity-100'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={handleCompareToggle}
            className={`p-2 rounded-full transition-all shadow-md backdrop-blur-md ${
              isCompared
                ? 'bg-blue-500/30 text-blue-400 border border-blue-500/60'
                : 'bg-black/40 text-slate-300 hover:text-blue-400 hover:bg-black/70 border border-white/10 opacity-80 group-hover:opacity-100'
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
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
          loading="lazy"
        />

        {/* Store Offers count badge */}
        {product.offers.length > 1 && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-slate-300">
            Compare <strong className="text-blue-400">{product.offers.length} stores</strong>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-[#0D1322]/80">
        <div>
          {/* Brand & Rating Row */}
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">{product.brand}</span>
            {product.rating && (
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                <span className="text-slate-500 font-normal">({product.reviewCount || '1.2k'})</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price Block & Store availability */}
        <div className="pt-3.5 mt-3 border-t border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider mb-0.5">
                Lowest Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-white tracking-tight">
                  {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-sm text-slate-400">Check Price</span>}
                </span>
                {product.offers[0]?.originalPrice && product.offers[0].originalPrice > (product.lowestPrice || 0) && (
                  <span className="text-xs text-slate-500 line-through font-medium">
                    {formatINR(product.offers[0].originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {product.bestStore && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-0.5">Best at</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-[#070B14] px-2 py-0.5 rounded-md border border-slate-800 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {product.bestStore.name.replace(' India', '')}
                </span>
              </div>
            )}
          </div>

          {/* Store Availability Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Available on:</span>
            {product.offers.slice(0, 3).map((offer) => (
              <span
                key={offer.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/50"
              >
                {offer.storeId.replace('store-', '').toUpperCase()}
              </span>
            ))}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(`/product/${product.slug}`);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 text-xs font-semibold transition-all text-center"
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
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-500/20 active:scale-95"
              >
                <span>Check Price</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
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
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-500/20"
              >
                <span>Compare</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
