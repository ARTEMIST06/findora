import React from 'react';
import { Heart, Scale, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { ProductWithPrices } from '../../types';
import { formatINR } from '../../utils/formatters';
import { displayCategoryName } from '../../utils/categories';
import { useFindoraStore } from '../../services/store';
import { useToast } from './Toast';
import { getProductImage, handleImageFallback } from '../../utils/visualAssets';

interface ProductCardProps {
  product: ProductWithPrices;
  onNavigate: (route: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();

  const isWishlisted = store.isInWishlist(product.id);
  const isCompared = store.isInCompare(product.id);

  // Wishlist works for guests too (localStorage) — no login wall.
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = store.toggleWishlist(product.id);
    showToast(added ? `Saved ${product.name} to wishlist` : 'Removed from wishlist', 'info');
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

  const mainImage = getProductImage(product);

  // All badges are the same small black pill — the deal info is in the
  // text, not the colour.
  const getBadgeStyle = () => 'bg-black text-white';

  return (
    <div
      onClick={() => onNavigate(`/product/${product.slug}`)}
      className="group relative bg-white rounded-none transition-all duration-300 flex flex-col overflow-hidden cursor-pointer card-lift"
      id={`product-card-${product.id}`}
    >
      {/* Top Image Stage — shorter 4:3 stage on phones saves ~90px per
          card on the single-column mobile grid; square on desktop. */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full bg-[#F3F4F6] p-5 flex items-center justify-center overflow-hidden">

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${getBadgeStyle()}`}
            >
              <Sparkles className="w-3 h-3" />
              {product.badge}
            </span>
          )}
          {product.maxDiscountPercent && product.maxDiscountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black text-white">
              <Tag className="w-3 h-3" />
              {product.maxDiscountPercent}% OFF
            </span>
          )}
        </div>

        {/* Top Right Quick Actions (Wishlist & Compare) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlistToggle}
            className={`p-2.5 sm:p-2 rounded-full transition-all ${
              isWishlisted
                ? 'bg-black text-white border border-black'
                : 'bg-white text-black hover:bg-slate-100 border border-slate-200 opacity-90 group-hover:opacity-100'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>

          <button
            onClick={handleCompareToggle}
            className={`p-2.5 sm:p-2 rounded-full transition-all ${
              isCompared
                ? 'bg-black text-white border border-black'
                : 'bg-white text-black hover:bg-slate-100 border border-slate-200 opacity-90 group-hover:opacity-100'
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
          onError={(e) => handleImageFallback(e, product.category)}
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Brand row — ratings are NOT shown: stored ratings are unverified,
              so Findora never presents a star score it cannot stand behind. */}
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
            <span className="font-bold text-black uppercase tracking-wider">{product.brand}</span>
            <span className="text-slate-600 font-medium capitalize truncate">{displayCategoryName(product.category)}</span>
          </div>

          {/* Product Title */}
          <h3 className="font-bold uppercase text-[13px] leading-snug line-clamp-2 text-black">
            {product.name}
          </h3>
        </div>

        {/* Price Block & Store availability */}
        <div className="pt-3.5 mt-3 border-t border-slate-200/80 flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <div>
              <span className="text-[10px] text-slate-600 block font-medium uppercase tracking-wider mb-0.5">
                Price on Amazon
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-sm text-slate-600">Check Price</span>}
                </span>
                {product.offers[0]?.originalPrice && product.offers[0].originalPrice > (product.lowestPrice || 0) && (
                  <span className="text-xs text-slate-600 line-through font-medium">
                    {formatINR(product.offers[0].originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {product.bestStore && (
              <div className="text-right">
                <span className="text-[10px] text-slate-600 block uppercase tracking-wider mb-0.5">Best at</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-black px-2 py-0.5 rounded-md border border-black">
                  <ShieldCheck className="w-3 h-3 text-white" />
                  {product.bestStore.name.replace(' India', '')}
                </span>
              </div>
            )}
          </div>

          {/* Store Availability — Findora lists Amazon India only. */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Available on:</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-black text-white border border-black">
              <ShieldCheck className="w-3 h-3 text-white" />
              Amazon India
            </span>
          </div>

          {/* Action Row — Check Price gets the wider share: in narrow
              Trending cards the two equal columns squeezed its label to
              ~2px of padding. */}
          <div className="grid grid-cols-[1fr_1.4fr] gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(`/product/${product.slug}`);
              }}
              className="w-full py-2 px-3 rounded-none border border-black text-black bg-white hover:bg-black hover:text-white text-xs font-semibold transition-all text-center"
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
                  try {
                    store.trackAffiliateClick(
                      product.id,
                      product.offers[0].storeId,
                      product.offers[0].price,
                      product.offers[0].affiliateUrl,
                      { pageLocation: typeof window !== 'undefined' ? window.location.pathname : '/' }
                    );
                  } catch (err) {
                    console.warn('Affiliate tracking error:', err);
                  }
                }}
                className="w-full py-2 px-2 rounded-none bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
              >
                <span>Check Price</span>
              </a>
            ) : product.offers.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showToast('Price link unavailable', 'info');
                }}
                className="w-full py-2 px-2 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all flex items-center justify-center gap-1 border border-slate-300"
                title="Price link unavailable"
              >
                <span className="truncate">Price unavailable</span>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(`/product/${product.slug}`);
                }}
                className="w-full py-2 px-2 rounded-none bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 whitespace-nowrap"
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
