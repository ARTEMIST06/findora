import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Share2,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
import { analytics } from '../../services/analytics';
import { formatINR, formatRelativeTime } from '../../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const currentUser = store.getCurrentUser();
  const [targetPrice, setTargetPrice] = useState('');
  const [isSettingAlert, setIsSettingAlert] = useState(false);
  const [existingAlert, setExistingAlert] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Minimal loading state
  useEffect(() => {
    const t = setTimeout(() => setIsPageLoading(false), 200);
    return () => clearTimeout(t);
  }, [slug]);

  useEffect(() => {
    if (currentUser && product) {
      store.getPriceAlerts(currentUser.id).then((alerts) => {
        const alertForProd = alerts.find((a) => a.productId === product.id && a.isActive);
        if (alertForProd) {
          setExistingAlert(alertForProd);
          setTargetPrice(alertForProd.targetPrice.toString());
        }
      });
    }
  }, [currentUser, product?.id]);

  useEffect(() => {
    if (product) {
      store.getPriceHistory(product.id).then(setPriceHistory);
      analytics.trackViewProduct({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: product.offers?.[0]?.price,
      });
      analytics.recordLocalProductView(product.id);
    }
  }, [product?.id]);

  if (isPageLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 animate-pulse">
        <div className="h-4 w-1/3 bg-slate-800 rounded-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5 aspect-square bg-slate-900 rounded-3xl border border-slate-800"></div>
          <div className="lg:col-span-7 space-y-4">
            <div className="h-6 w-1/4 bg-slate-800 rounded-full"></div>
            <div className="h-10 w-3/4 bg-slate-800 rounded-xl"></div>
            <div className="h-20 w-full bg-slate-800 rounded-2xl"></div>
            <div className="h-32 w-full bg-slate-900 rounded-3xl mt-6 border border-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
        <p className="text-slate-400 mb-6 max-w-sm">
          The requested product or link may have been updated, removed, or doesn't exist in our catalog.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  const isWishlisted = store.isInWishlist(product.id);
  const isCompared = store.isInCompare(product.id);
  
  const similarProducts = store
    .getAllProductsWithPrices(true)
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleWishlistToggle = () => {
    if (!store.getCurrentUser()) {
      showToast('Please log in to save to wishlist', 'info');
      onNavigate('/login');
      return;
    }
    store.toggleWishlist(product.id);
    showToast(store.isInWishlist(product.id) ? `Saved ${product.name} to wishlist` : 'Removed from wishlist', 'info');
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

  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to set a price alert.', 'error');
      return;
    }
    const target = parseFloat(targetPrice);
    if (isNaN(target) || target <= 0) {
      showToast('Please enter a valid target price greater than 0.', 'error');
      return;
    }
    const bestOffer = product?.offers[0];
    if (!bestOffer) return;

    setIsSettingAlert(true);
    try {
      if (existingAlert) {
        await store.updatePriceAlert(existingAlert.id, { targetPrice: target, isActive: true });
        setExistingAlert({ ...existingAlert, targetPrice: target, isActive: true });
        showToast(`Alert updated! We will notify you when the price drops below ₹${target}.`, 'success');
      } else {
        const newAlert = await store.addPriceAlert({
          userId: currentUser.id,
          productId: product!.id,
          offerId: bestOffer.id,
          targetPrice: target,
          currency: bestOffer.currency,
          isActive: true,
        });
        if (newAlert) {
          setExistingAlert(newAlert);
          showToast(`Alert created! We will notify you when the price drops below ₹${target}.`, 'success');
        } else {
          showToast('Failed to create price alert.', 'error');
        }
      }
    } catch (err) {
      showToast('An error occurred while setting the alert.', 'error');
    }
    setIsSettingAlert(false);
  };

  const bestOffer = product.offers[0];
  const sortedOffers = [...product.offers].sort((a, b) => a.price - b.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      <SEOHead
        title={`${product.name} Best Price in India - Findora`}
        description={product.shortDescription || `Compare prices for ${product.name} across major Indian retailers on Findora.`}
        image={product.images[0]}
        url={currentUrl}
        type="product"
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
        <button onClick={() => onNavigate('/')} className="hover:text-blue-400 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-600" />
        <button onClick={() => onNavigate('/products')} className="hover:text-blue-400 transition-colors">
          Products
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-600" />
        <button
          onClick={() => onNavigate(`/category/${product.category}`)}
          className="hover:text-blue-400 capitalize transition-colors"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-600" />
        <span className="text-white font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Top Overview: Gallery & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-3xl bg-[#080D1A] border border-slate-800/80 p-8 flex items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Ambient Glow */}
            <div className="absolute inset-0 product-backdrop-glow pointer-events-none"></div>

            {product.badge && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white shadow-md border border-blue-400/30 z-10 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                {product.badge}
              </span>
            )}
            <img
              src={product.images[selectedImageIndex] || product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
              alt={product.name}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-2xl border p-1 bg-[#080D1A] shrink-0 overflow-hidden transition-all ${
                    selectedImageIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                      : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Key Info & Price Buybox */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            {/* Brand & Category & Ratings */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                {product.brand}
              </span>
              {product.rating && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                  {product.reviewCount && (
                    <span className="text-slate-400 font-normal">
                      ({product.reviewCount.toLocaleString('en-IN')} ratings)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Short Description */}
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              {product.shortDescription || 'No description available for this product.'}
            </p>

            {/* Lowest Price Banner / Best Store highlight */}
            <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0E1628] via-[#090F1E] to-[#070B14] border border-blue-500/30 relative overflow-hidden shadow-2xl">
              {/* Backlight */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Current Lowest Price
                    </span>
                    {product.maxDiscountPercent ? (
                      <span className="text-[11px] font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        Save {product.maxDiscountPercent}%
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-2xl text-slate-500">Unavailable</span>}
                    </span>
                    {bestOffer?.originalPrice && product.lowestPrice && bestOffer.originalPrice > product.lowestPrice && (
                      <span className="text-sm text-slate-500 line-through font-medium">
                        MRP {formatINR(bestOffer.originalPrice)}
                      </span>
                    )}

                    {bestOffer?.priceDrop && (
                      <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {bestOffer.priceDrop.percentage}% OFF (↓{formatINR(bestOffer.priceDrop.amount)})
                      </span>
                    )}
                  </div>
                  
                  {product.bestStore && (
                    <p className="text-xs sm:text-sm text-slate-300 font-medium mt-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Best price at <strong className="text-white font-bold">{product.bestStore.name}</strong></span>
                      {bestOffer?.shippingNote && (
                        <span className="text-slate-500 font-normal hidden sm:inline">• {bestOffer.shippingNote}</span>
                      )}
                    </p>
                  )}
                </div>
                
                {bestOffer && (
                  bestOffer.affiliateUrl ? (
                    <a
                      href={bestOffer.affiliateUrl.startsWith('http') ? bestOffer.affiliateUrl : `https://${bestOffer.affiliateUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => store.trackAffiliateClick(product.id, bestOffer.storeId, bestOffer.price, bestOffer.affiliateUrl)}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 shrink-0 group active:scale-95"
                    >
                      <span>Check Price</span>
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-800 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 shrink-0 cursor-not-allowed border border-slate-700"
                    >
                      <span>Currently Unavailable</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Quick Actions (Wishlist, Compare, Share) */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleWishlistToggle}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-full border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isWishlisted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-[#0D1322] text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-400' : 'text-slate-400'}`} />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>

              <button
                onClick={handleCompareToggle}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-full border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isCompared
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    : 'bg-[#0D1322] text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Scale className={`w-4 h-4 ${isCompared ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{isCompared ? 'In Compare' : 'Compare'}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex-1 min-w-[120px] py-2.5 px-4 rounded-full border bg-[#0D1322] text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* "Why Findora Picked It" Callout Box */}
          {product.whyFindora && (
            <div className="p-5 rounded-3xl bg-[#0D1426] border border-blue-500/30 text-slate-300 shadow-xl mt-6">
              <div className="flex items-center gap-2 font-bold text-blue-300 text-sm mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Why Findora Recommends This</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {product.whyFindora}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real Multi-Store Price Comparison Table */}
      <section className="space-y-5 pt-8 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Live Multi-Store Price Comparison
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Verified prices across authorized retailers. Sorted by lowest price first.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-[#0D1322] px-4 py-1.5 rounded-full border border-slate-700 self-start sm:self-auto shadow-sm">
            {sortedOffers.length > 0 ? `${sortedOffers.length} Verified Offers` : 'No Offers Available'}
          </span>
        </div>

        {/* Table Container */}
        {sortedOffers.length > 0 ? (
          <div className="bg-[#0D1322]/90 rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-[#070B14] text-slate-400 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-4 sm:px-6">Merchant</th>
                    <th className="py-4 px-4">Price</th>
                    <th className="py-4 px-4 hidden md:table-cell">Shipping</th>
                    <th className="py-4 px-4 hidden lg:table-cell">Verified</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedOffers.map((offer, idx) => {
                    const storeObj = stores.find((s) => s.id === offer.storeId);
                    const isLowest = idx === 0;
                    const discount =
                      offer.originalPrice && offer.originalPrice > offer.price
                        ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
                        : 0;

                    return (
                      <tr
                        key={offer.id}
                        className={`hover:bg-slate-800/40 transition-colors group ${
                          isLowest ? 'bg-blue-600/10' : ''
                        }`}
                      >
                        {/* Merchant */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            {isLowest && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Lowest Price
                              </span>
                            )}
                            <span className="font-bold text-white text-sm">
                              {storeObj?.name || 'Merchant Partner'}
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-white">
                                {formatINR(offer.price)}
                              </span>
                              {discount > 0 && (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                            {offer.originalPrice && offer.originalPrice > offer.price && (
                              <span className="text-xs text-slate-500 line-through font-medium">
                                MRP {formatINR(offer.originalPrice)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Shipping */}
                        <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-400 font-medium">
                          {offer.shippingNote || 'Standard Delivery'}
                        </td>

                        {/* Last Updated */}
                        <td className="py-4 px-4 hidden lg:table-cell text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatRelativeTime(offer.lastUpdated)}</span>
                          </div>
                        </td>

                        {/* Action Button */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {offer.affiliateUrl ? (
                            <a
                              href={offer.affiliateUrl.startsWith('http') ? offer.affiliateUrl : `https://${offer.affiliateUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => store.trackAffiliateClick(product.id, offer.storeId, offer.price, offer.affiliateUrl)}
                              className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md w-[120px] ${
                                isLowest
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-indigo-500/20'
                                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                              }`}
                            >
                              <span>Check Price</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all bg-slate-900 text-slate-500 w-[120px] cursor-not-allowed border border-slate-800"
                            >
                              <span>Unavailable</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#0D1322] border border-slate-800 border-dashed rounded-3xl p-10 text-center">
            <h3 className="text-white font-bold mb-1">No Offers Available</h3>
            <p className="text-slate-400 text-sm">We couldn't find any live pricing for this product right now. Set a price alert to be notified when it returns.</p>
          </div>
        )}
      </section>

      {/* Pros & Cons Section */}
      {(product.pros.length > 0 || product.cons.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/80">
          {/* Pros */}
          {product.pros.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0D1322]/80 border border-emerald-500/20 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-base mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Strengths & Highlights</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 font-normal">
                {product.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                    <span className="leading-relaxed">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {product.cons.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0D1322]/80 border border-rose-500/20 shadow-xl">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-base mb-4">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Things to Consider</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 font-normal">
                {product.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></span>
                    <span className="leading-relaxed">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Detailed Tabs: Specifications, Price History Chart, Full Review */}
      <section className="space-y-6 pt-6 border-t border-slate-800/80">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all whitespace-nowrap ${
              activeTab === 'specs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingDown className={`w-4 h-4 ${activeTab === 'history' ? 'text-white' : 'text-emerald-400'}`} />
            <span>Price History & Alerts</span>
          </button>
          {product.description && (
            <button
              onClick={() => setActiveTab('description')}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all whitespace-nowrap ${
                activeTab === 'description'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Overview
            </button>
          )}
        </div>

        {/* Tab 1: Specs */}
        {activeTab === 'specs' && (
          <div className="bg-[#0D1322]/90 rounded-3xl border border-slate-800/80 p-6 sm:p-8 overflow-hidden shadow-2xl">
            {Object.keys(product.specifications).length > 0 ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1 text-sm">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex flex-col py-3.5 border-b border-slate-800/80">
                    <dt className="text-slate-400 font-medium text-xs mb-1 uppercase tracking-wider">{key}</dt>
                    <dd className="text-white font-bold text-sm sm:text-base">{val}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-slate-400 text-sm italic">No technical specifications available for this model.</p>
            )}
          </div>
        )}

        {/* Tab 2: Price History Chart */}
        {activeTab === 'history' && (
          <div className="bg-[#0D1322]/90 rounded-3xl border border-slate-800/80 p-6 sm:p-8 space-y-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="font-extrabold text-white text-xl tracking-tight">Recorded Price Trend</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Track historical price changes across merchants to decide if this is the right time to buy. Findora monitors daily fluctuations to ensure you get the best deal.
                </p>
              </div>

              {/* Price Alert Signup */}
              <div className="bg-[#070B14] p-5 rounded-2xl border border-blue-500/30 shrink-0 w-full md:w-auto shadow-lg">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5 mb-3">
                  <BellRing className="w-4 h-4 text-blue-400" /> Wait for a better price?
                </h4>
                {!currentUser ? (
                  <button
                    onClick={() => {
                      showToast('Please sign in to set price alerts.', 'info');
                      onNavigate('/login');
                    }}
                    className="w-full px-5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-full text-xs font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Sign In for Alerts</span>
                  </button>
                ) : (
                  <form onSubmit={handlePriceAlertSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Target price..."
                        className="pl-8 pr-4 py-2 text-xs font-bold text-white rounded-full border border-slate-700 outline-none focus:border-blue-500 w-full sm:w-40 bg-[#0A0F1D]"
                        disabled={isSettingAlert}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSettingAlert}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
                    >
                      {isSettingAlert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{existingAlert ? 'Update Alert' : 'Set Alert'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Price timeline points */}
            {priceHistory.length > 0 && (() => {
              const allPrices = priceHistory.map((ph) => ph.price).filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);
              const lowestHistory = allPrices.length > 0 ? Math.min(...allPrices) : null;
              const highestHistory = allPrices.length > 0 ? Math.max(...allPrices) : null;
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#080D1A] border border-emerald-500/30 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Lowest Recorded</p>
                    <p className="text-xl font-extrabold text-white">{lowestHistory ? formatINR(lowestHistory) : 'N/A'}</p>
                  </div>
                  <div className="bg-[#080D1A] border border-slate-800 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Highest Recorded</p>
                    <p className="text-xl font-extrabold text-white">{highestHistory ? formatINR(highestHistory) : 'N/A'}</p>
                  </div>
                </div>
              );
            })()}
            
            <div className="pt-4 w-full h-[300px]">
              {priceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...priceHistory].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis 
                      dataKey="recordedAt" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(val) => `₹${val}`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatINR(value), 'Price']}
                      labelFormatter={(label) => new Date(label).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', border: '1px solid #334155', color: '#F8FAFC', fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: '#38BDF8', strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-[#070B14] rounded-2xl border border-slate-800 border-dashed">
                  <TrendingDown className="w-10 h-10 mb-3 opacity-40 text-blue-400" />
                  <p className="text-base font-bold text-white">No price history available yet</p>
                  <p className="text-xs mt-1 max-w-sm text-center text-slate-500">Price history will appear on this chart as Findora tracks this product's price fluctuations over time.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Full Description */}
        {activeTab === 'description' && product.description && (
          <div className="bg-[#0D1322]/90 rounded-3xl border border-slate-800/80 p-6 sm:p-8 text-sm text-slate-300 leading-loose space-y-6 shadow-2xl font-normal">
            <p>{product.description}</p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Trust & Transparency */}
      <section className="bg-[#0D1322]/80 rounded-3xl p-6 border border-slate-800/80 mt-10 mb-24 lg:mb-10 text-xs sm:text-sm text-slate-400 leading-relaxed">
        <div className="flex gap-4">
          <Info className="w-6 h-6 shrink-0 text-blue-400" />
          <div className="space-y-2">
            <p><strong className="text-white font-semibold">Transparency Disclosure:</strong> Findora is an independent price comparison service. When you click a "Check Price" link and make a purchase on a merchant's website, we may earn an affiliate commission at no extra cost to you. This supports our platform.</p>
            <p>Prices, discounts, and inventory availability are controlled by the merchants and are subject to change without notice. The final price and terms of sale are always confirmed at the merchant's checkout. Findora does not process your transaction.</p>
          </div>
        </div>
      </section>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-800/80 pb-20 lg:pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Similar Alternatives</h2>
            <button
              onClick={() => onNavigate(`/category/${product.category}`)}
              className="text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              View category →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-[#070B14]/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl z-40 lg:hidden flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Price</span>
          <span className="text-xl font-extrabold text-white truncate">
            {product.lowestPrice ? formatINR(product.lowestPrice) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleWishlistToggle} 
            className={`p-3 rounded-full border transition-colors ${
              isWishlisted
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>
          {bestOffer?.affiliateUrl ? (
            <a
              href={bestOffer.affiliateUrl.startsWith('http') ? bestOffer.affiliateUrl : `https://${bestOffer.affiliateUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => store.trackAffiliateClick(product.id, bestOffer.storeId, bestOffer.price, bestOffer.affiliateUrl)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-sm shadow-md shadow-indigo-500/20 whitespace-nowrap active:scale-95 transition-transform"
            >
              Check Price
            </a>
          ) : (
            <button disabled className="px-6 py-3 bg-slate-800 text-slate-500 rounded-full font-bold text-sm whitespace-nowrap border border-slate-700 cursor-not-allowed">
              Unavailable
            </button>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0D1322] rounded-3xl w-full max-w-sm shadow-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#070B14]">
              <h3 className="font-extrabold text-white text-lg">Share Product</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white transition-colors bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUrl);
                  showToast('Link copied to clipboard!', 'success');
                  setIsShareModalOpen(false);
                }}
                className="w-full text-left px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm text-white transition-colors"
              >
                Copy Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on Findora! ${currentUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm text-white transition-colors"
              >
                Share on WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name} on Findora!`)}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm text-white transition-colors"
              >
                Share on X (Twitter)
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Findora - ${product.name}`)}&body=${encodeURIComponent(`Check out this product I found on Findora:\n\n${product.name}\n${currentUrl}`)}`}
                className="block w-full text-left px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm text-white transition-colors"
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
