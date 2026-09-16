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
  AlertTriangle
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
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

  // Simulate minimal loading state for better UX
  useEffect(() => {
    const t = setTimeout(() => setIsPageLoading(false), 300);
    return () => clearTimeout(t);
  }, [slug]);

  useEffect(() => {
    if (currentUser && product) {
       store.getPriceAlerts(currentUser.id).then(alerts => {
           const alertForProd = alerts.find(a => a.productId === product.id && a.isActive);
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
    }
  }, [product?.id]);

  if (isPageLoading) {
    return (
       <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 animate-pulse">
           <div className="h-4 w-1/3 bg-slate-200 rounded-lg"></div>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-5 aspect-square bg-slate-100 rounded-2xl"></div>
              <div className="lg:col-span-7 space-y-4">
                 <div className="h-6 w-1/4 bg-slate-200 rounded-lg"></div>
                 <div className="h-10 w-3/4 bg-slate-200 rounded-lg"></div>
                 <div className="h-20 w-full bg-slate-200 rounded-lg"></div>
                 <div className="h-32 w-full bg-slate-100 rounded-2xl mt-6"></div>
              </div>
           </div>
       </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">
          The requested product or link may have been updated, removed, or doesn't exist.
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
    const added = store.toggleWishlist(product.id);
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
    } catch (e) {
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
      <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
        <button onClick={() => onNavigate('/')} className="hover:text-blue-600 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <button onClick={() => onNavigate('/products')} className="hover:text-blue-600 transition-colors">
          Products
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <button
          onClick={() => onNavigate(`/category/${product.category}`)}
          className="hover:text-blue-600 capitalize transition-colors"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Top Overview: Gallery & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-2xl bg-white border border-slate-200/80 p-6 flex items-center justify-center relative overflow-hidden shadow-xs">
            {product.badge && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs z-10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {product.badge}
              </span>
            )}
            <img
              src={product.images[selectedImageIndex] || product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
              alt={product.name}
              className="w-full h-full object-contain transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
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

        {/* Right: Key Info & Price Buybox */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            {/* Brand & Category & Ratings */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                {product.brand}
              </span>
              {product.rating && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <span>★ {product.rating}</span>
                  {product.reviewCount && (
                    <span className="text-xs text-slate-500 font-normal">
                      ({product.reviewCount.toLocaleString('en-IN')} ratings)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Short Description */}
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {product.shortDescription || 'No description available for this product.'}
            </p>

            {/* Lowest Price Banner / Best Store highlight */}
            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Current Lowest Price
                    </span>
                    {product.maxDiscountPercent ? (
                      <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                        Save {product.maxDiscountPercent}%
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {product.lowestPrice ? formatINR(product.lowestPrice) : <span className="text-2xl text-slate-400">Unavailable</span>}
                    </span>
                    {bestOffer?.originalPrice && product.lowestPrice && bestOffer.originalPrice > product.lowestPrice && (
                      <span className="text-sm text-slate-400 line-through font-medium">
                        MRP {formatINR(bestOffer.originalPrice)}
                      </span>
                    )}

                    {bestOffer?.priceDrop && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {bestOffer.priceDrop.percentage}% OFF (↓{formatINR(bestOffer.priceDrop.amount)})
                      </span>
                    )}
                  </div>
                  
                  {product.bestStore && (
                    <p className="text-sm text-emerald-800 font-medium mt-2">
                      Available at <strong className="text-slate-900">{product.bestStore.name}</strong>{' '}
                      {bestOffer?.shippingNote && <span className="text-slate-500 font-normal opacity-90 hidden sm:inline">• {bestOffer.shippingNote}</span>}
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
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0 group"
                    >
                      <span>Check Price</span>
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-300 text-slate-500 font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-not-allowed"
                    >
                      <span>Currently Unavailable</span>
                    </button>
                  )
                )}
              </div>
              
              {/* Decorative background element */}
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Quick Actions (Wishlist, Compare, Share) */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleWishlistToggle}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>

              <button
                onClick={handleCompareToggle}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isCompared
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Scale className={`w-4 h-4 ${isCompared ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{isCompared ? 'In Compare' : 'Compare'}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* "Why Findora Picked It" Callout Box */}
          {product.whyFindora && (
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-slate-800 shadow-sm mt-6">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Why Findora Recommends This</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {product.whyFindora}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real Multi-Store Price Comparison Table */}
      <section className="space-y-5 pt-8 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Live Price Comparison
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Verified prices across our network. We sort by lowest price first.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 self-start sm:self-auto shadow-sm">
            {sortedOffers.length > 0 ? `${sortedOffers.length} Verified Offers` : 'No Offers Available'}
          </span>
        </div>

        {/* Table Container */}
        {sortedOffers.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-4 sm:px-6">Merchant</th>
                    <th className="py-4 px-4">Price</th>
                    <th className="py-4 px-4 hidden md:table-cell">Shipping</th>
                    <th className="py-4 px-4 hidden lg:table-cell">Verified</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                        className={`hover:bg-slate-50/80 transition-colors group ${
                          isLowest ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {/* Merchant */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            {isLowest && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200/50">
                                Lowest
                              </span>
                            )}
                            <span className="font-bold text-slate-900 text-sm">
                              {storeObj?.name || 'Merchant Partner'}
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-slate-900">
                                {formatINR(offer.price)}
                              </span>
                              {discount > 0 && (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200/50">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                            {offer.originalPrice && offer.originalPrice > offer.price && (
                              <span className="text-xs text-slate-400 line-through font-medium">
                                MRP {formatINR(offer.originalPrice)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Shipping */}
                        <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-600 font-medium">
                          {offer.shippingNote || 'Standard Delivery'}
                        </td>

                        {/* Last Updated */}
                        <td className="py-4 px-4 hidden lg:table-cell text-xs text-slate-400 font-medium">
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
                              className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm w-[120px] ${
                                isLowest
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              <span>Check Price</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-400 w-[120px] cursor-not-allowed border border-slate-200"
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
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center">
            <h3 className="text-slate-900 font-bold mb-1">No Offers Available</h3>
            <p className="text-slate-500 text-sm">We couldn't find any live pricing for this product right now. Set a price alert to be notified when it returns.</p>
          </div>
        )}
      </section>

      {/* Pros & Cons Section */}
      {(product.pros.length > 0 || product.cons.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
          {/* Pros */}
          {product.pros.length > 0 && (
            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Strengths & Highlights</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-700 font-medium">
                {product.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span className="leading-relaxed">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {product.cons.length > 0 && (
            <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-base mb-4">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Things to Consider</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-700 font-medium">
                {product.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                    <span className="leading-relaxed">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Detailed Tabs: Specifications, Price History Chart, Full Review */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'specs'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingDown className={`w-4 h-4 ${activeTab === 'history' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>Price History & Alerts</span>
          </button>
          {product.description && (
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'description'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
          )}
        </div>

        {/* Tab 1: Specs */}
        {activeTab === 'specs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 overflow-hidden shadow-xs">
            {Object.keys(product.specifications).length > 0 ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1 text-sm">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex flex-col py-3 border-b border-slate-100">
                    <dt className="text-slate-500 font-medium mb-1">{key}</dt>
                    <dd className="text-slate-900 font-bold">{val}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-slate-500 text-sm italic">No technical specifications available.</p>
            )}
          </div>
        )}

        {/* Tab 2: Price History Chart */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Recorded Price Trend</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Track historical price changes across merchants to decide if this is the right time to buy. Findora monitors daily fluctuations to ensure you get the best deal.
                </p>
              </div>

              {/* Price Alert Signup */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shrink-0 w-full md:w-auto">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-3">
                  <BellRing className="w-4 h-4 text-blue-600" /> Wait for a better price?
                </h4>
                {!currentUser ? (
                  <button
                    onClick={() => { showToast('Please sign in to set price alerts.', 'info'); onNavigate('/login'); }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Sign In for Alerts</span>
                  </button>
                ) : (
                  <form onSubmit={handlePriceAlertSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Target price..."
                        className="pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-40 bg-white"
                        disabled={isSettingAlert}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSettingAlert}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isSettingAlert ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      <span>{existingAlert ? 'Update Alert' : 'Set Alert'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Price timeline points visualization */}
            {priceHistory.length > 0 && (() => {
               const allPrices = priceHistory.map(ph => ph.price).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
               const lowestHistory = allPrices.length > 0 ? Math.min(...allPrices) : null;
               const highestHistory = allPrices.length > 0 ? Math.max(...allPrices) : null;
               
               return (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-xl">
                     <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 opacity-80">Lowest Recorded</p>
                     <p className="text-xl font-extrabold text-emerald-900">{lowestHistory ? formatINR(lowestHistory) : 'N/A'}</p>
                   </div>
                   <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Highest Recorded</p>
                     <p className="text-xl font-extrabold text-slate-900">{highestHistory ? formatINR(highestHistory) : 'N/A'}</p>
                   </div>
                 </div>
               );
            })()}
            
            <div className="pt-4 w-full h-[300px]">
              {priceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...priceHistory].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="recordedAt" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      dy={15}
                    />
                    <YAxis 
                      tickFormatter={(val) => `₹${val}`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatINR(value), 'Price']}
                      labelFormatter={(label) => new Date(label).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 600, color: '#0f172a' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <TrendingDown className="w-10 h-10 mb-3 opacity-30 text-slate-700" />
                  <p className="text-base font-bold text-slate-800">No price history available yet</p>
                  <p className="text-sm mt-1 max-w-sm text-center">Price history will appear on this chart as Findora tracks this product's price fluctuations over time.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Full Description */}
        {activeTab === 'description' && product.description && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-sm text-slate-700 leading-loose space-y-6 shadow-xs font-medium">
            <p>{product.description}</p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider"
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
      <section className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mt-10 mb-24 lg:mb-10 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
        <div className="flex gap-4">
          <Info className="w-6 h-6 shrink-0 text-slate-400" />
          <div className="space-y-2">
            <p><strong className="text-slate-700">Transparency Disclosure:</strong> Findora is an independent price comparison service. When you click a "Check Price" link and make a purchase on a merchant's website, we may earn an affiliate commission at no extra cost to you. This supports our platform.</p>
            <p>Prices, discounts, and inventory availability are controlled by the merchants and are subject to change without notice. The final price and terms of sale are always confirmed at the merchant's checkout. Findora does not process your transaction.</p>
          </div>
        </div>
      </section>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-200 pb-20 lg:pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Similar Alternatives</h2>
            <button
              onClick={() => onNavigate(`/category/${product.category}`)}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View category
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
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] z-40 lg:hidden flex items-center justify-between gap-4 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Best Price</span>
          <span className="text-xl font-extrabold text-slate-900 truncate">
            {product.lowestPrice ? formatINR(product.lowestPrice) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
           <button 
             onClick={handleWishlistToggle} 
             className={`p-3 rounded-xl border transition-colors ${isWishlisted ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
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
               className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 whitespace-nowrap active:scale-95 transition-transform"
             >
               Check Price
             </a>
           ) : (
              <button disabled className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm whitespace-nowrap border border-slate-200 cursor-not-allowed">
                Unavailable
              </button>
           )}
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-lg">Share Product</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors bg-white border border-slate-200"
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
                className="w-full text-left px-5 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 font-bold text-sm text-slate-700 transition-colors"
              >
                Copy Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on Findora! ${currentUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-5 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 font-bold text-sm text-slate-700 transition-colors"
              >
                Share on WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name} on Findora!`)}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-5 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 font-bold text-sm text-slate-700 transition-colors"
              >
                Share on X (Twitter)
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left px-5 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 font-bold text-sm text-slate-700 transition-colors"
              >
                Share on Facebook
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Findora - ${product.name}`)}&body=${encodeURIComponent(`Check out this product I found on Findora:\n\n${product.name}\n${currentUrl}`)}`}
                className="block w-full text-left px-5 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 font-bold text-sm text-slate-700 transition-colors"
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
