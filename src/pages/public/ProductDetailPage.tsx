import React, { useState } from 'react';
import {
  Heart,
  Scale,
  ExternalLink,
  ShieldCheck,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingDown,
  BellRing,
  Info,
  Layers,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
import { formatINR, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import { ProductCard } from '../../components/common/ProductCard';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (route: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onNavigate }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();

  const product = store.getProductWithPrices(slug);
  const stores = store.getStores();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'history' | 'description'>('specs');
  const [priceAlertEmail, setPriceAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">
          The requested product or link may have been updated or moved.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  const isWishlisted = store.isInWishlist(product.id);
  const isCompared = store.isInCompare(product.id);
  const priceHistory = store.getPriceHistory(product.id);

  // Similar products from same category
  const similarProducts = store
    .getAllProductsWithPrices(true)
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleWishlistToggle = () => {
    const added = store.toggleWishlist(product.id);
    showToast(added ? `Saved ${product.name} to wishlist` : 'Removed from wishlist', 'info');
  };

  const handleCompareToggle = () => {
    if (isCompared) {
      store.removeFromCompare(product.id);
      showToast('Removed from comparison', 'info');
    } else {
      const added = store.addToCompare(product.id);
      if (added) {
        showToast('Added to comparison tool', 'success');
      } else {
        showToast('Comparison is full (max 4 products). Remove an item to add this one.', 'error');
      }
    }
  };

  const handleStoreClick = (offer: (typeof product.offers)[0]) => {
    if (!offer.affiliateUrl) {
      showToast('Offer link is currently unavailable.', 'error');
      return;
    }
    store.trackAffiliateClick(product.id, offer.storeId, offer.price, offer.affiliateUrl);
    const storeObj = stores.find((s) => s.id === offer.storeId);
    showToast(`Redirecting to ${storeObj?.name || 'store'}...`, 'info');
    const url = offer.affiliateUrl.startsWith('http') ? offer.affiliateUrl : `https://${offer.affiliateUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    const shareData = {
      title: `Findora - ${product.name}`,
      text: `Check out ${product.name} on Findora!`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch((err) => {
        console.error('Error sharing:', err);
      });
    } else {
      setIsShareModalOpen(true);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';


  const handlePriceAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (priceAlertEmail && priceAlertEmail.includes('@')) {
      setAlertSubmitted(true);
      showToast(`Price alert created! We will email ${priceAlertEmail} if price drops further.`, 'success');
    }
  };

  const bestOffer = product.offers[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      <SEOHead
        title={`${product.name} - Findora`}
        description={product.shortDescription}
        image={product.images[0]}
        url={currentUrl}
        type="product"
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => onNavigate('/')} className="hover:text-blue-600">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => onNavigate('/products')} className="hover:text-blue-600">
          Products
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={() => onNavigate(`/category/${product.category}`)}
          className="hover:text-blue-600 capitalize"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Top Overview: Gallery & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Images Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-2xl bg-white border border-slate-200/80 p-6 flex items-center justify-center relative overflow-hidden shadow-xs">
            {product.badge && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs z-10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {product.badge}
              </span>
            )}
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border p-1 bg-white shrink-0 overflow-hidden transition-all ${
                    selectedImageIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Key Info & Price Buybox (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            {/* Brand & Category & Ratings */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                {product.brand}
              </span>
              {product.rating && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <span>★ {product.rating}</span>
                  <span className="text-xs text-slate-500 font-normal">
                    ({product.reviewCount?.toLocaleString('en-IN')} verified ratings)
                  </span>
                </div>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Short Description */}
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Lowest Price Banner / Best Store highlight */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Current Lowest Price
                    </span>
                    {product.maxDiscountPercent && (
                      <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Save {product.maxDiscountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-2xl text-slate-400">Price unavailable</span>}
                    </span>
                    {bestOffer?.originalPrice && product.lowestPrice && bestOffer.originalPrice > product.lowestPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        MRP {formatINR(bestOffer.originalPrice)}
                      </span>
                    )}
                  </div>
                  {product.bestStore && (
                    <p className="text-xs text-emerald-700 font-medium mt-1">
                      Available at <strong className="text-slate-900">{product.bestStore.name}</strong>{' '}
                      {bestOffer?.shippingNote && `• ${bestOffer.shippingNote}`}
                    </p>
                  )}
                </div>

                {bestOffer && (
                  <button
                    onClick={() => handleStoreClick(bestOffer)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>Go to {product.bestStore?.name || 'Deal'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions (Wishlist, Compare, Share) */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleWishlistToggle}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>

              <button
                onClick={handleCompareToggle}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isCompared
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Scale className="w-4 h-4 text-blue-600" />
                <span>{isCompared ? 'In Compare' : 'Compare'}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* "Why Findora Picked It" Callout Box */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-slate-800">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Why Findora Recommends This</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {product.whyFindora}
            </p>
          </div>
        </div>
      </div>

      {/* Real Multi-Store Price Comparison Table */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Live Store Price Comparison
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Prices updated regularly by Findora. Click "Check Price" to open the merchant with our referral.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {product.offers.length > 0 ? `${product.offers.length} ${product.offers.length === 1 ? 'store offer' : 'store offers found'}` : 'No store offers found yet.'}
          </span>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/90 text-slate-500 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Store</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Shipping & Offers</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Last Updated</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {product.offers.map((offer, idx) => {
                  const storeObj = stores.find((s) => s.id === offer.storeId);
                  const isLowest = idx === 0;
                  const discount =
                    offer.originalPrice && offer.originalPrice > offer.price
                      ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
                      : 0;

                  return (
                    <tr
                      key={offer.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLowest ? 'bg-emerald-50/30 font-medium' : ''
                      }`}
                    >
                      {/* Store */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {isLowest && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Lowest
                            </span>
                          )}
                          <span className="font-bold text-slate-900 text-sm">
                            {storeObj?.name || 'Merchant'}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-base font-extrabold text-slate-900">
                            {formatINR(offer.price)}
                          </span>
                          {offer.originalPrice && offer.originalPrice > offer.price && (
                            <span className="text-xs text-slate-400 line-through">
                              MRP {formatINR(offer.originalPrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="py-4 px-4">
                        {discount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            Save {discount}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Regular</span>
                        )}
                      </td>

                      {/* Shipping / Note */}
                      <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-600">
                        {offer.shippingNote || 'Standard Delivery available'}
                      </td>

                      {/* Last Updated */}
                      <td className="py-4 px-4 hidden lg:table-cell text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatRelativeTime(offer.lastUpdated)}</span>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handleStoreClick(offer)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                            isLowest
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Check Price</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pros & Cons Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Pros */}
        <div className="p-6 rounded-2xl bg-emerald-50/40 border border-emerald-200/80">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Strengths & Reasons to Buy</span>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            {product.pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="p-6 rounded-2xl bg-rose-50/40 border border-rose-200/80">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-base mb-4">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>Things to Keep in Mind</span>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            {product.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Detailed Tabs: Specifications, Price History Chart, Full Review */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'specs'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span>Price Drop History</span>
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'description'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Overview
          </button>
        </div>

        {/* Tab 1: Specs */}
        {activeTab === 'specs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 overflow-hidden">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs sm:text-sm">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="flex flex-col py-2 border-b border-slate-100">
                  <dt className="text-slate-400 font-medium">{key}</dt>
                  <dd className="text-slate-900 font-semibold mt-0.5">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Tab 2: Price History Chart */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recorded Price Trend</h3>
                <p className="text-xs text-slate-500">
                  Track price changes recorded across stores over the last several months.
                </p>
              </div>

              {/* Price Alert Signup */}
              <div className="flex items-center gap-2">
                {alertSubmitted ? (
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    ✓ Price drop alert registered!
                  </div>
                ) : (
                  <form onSubmit={handlePriceAlertSubmit} className="flex items-center gap-2">
                    <input
                      type="email"
                      required
                      value={priceAlertEmail}
                      onChange={(e) => setPriceAlertEmail(e.target.value)}
                      placeholder="Notify when price drops..."
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1 shrink-0"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Set Alert</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Price timeline points visualization */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {priceHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-500">{item.date}</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-slate-900">
                      {formatINR(item.price)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">at {item.storeName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Full Description */}
        {activeTab === 'description' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-700 leading-relaxed space-y-4">
            <p>{product.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Similar Alternatives</h2>
            <button
              onClick={() => onNavigate(`/category/${product.category}`)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View category
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Share Product</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUrl);
                  showToast('Link copied to clipboard!', 'success');
                  setIsShareModalOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-sm text-slate-700 transition-colors"
              >
                Copy Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on Findora! ${currentUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-sm text-slate-700 transition-colors"
              >
                Share on WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name} on Findora!`)}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-sm text-slate-700 transition-colors"
              >
                Share on X (Twitter)
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-sm text-slate-700 transition-colors"
              >
                Share on Facebook
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Findora - ${product.name}`)}&body=${encodeURIComponent(`Check out this product I found on Findora:\n\n${product.name}\n${currentUrl}`)}`}
                className="block w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-sm text-slate-700 transition-colors"
              >
                Share via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
