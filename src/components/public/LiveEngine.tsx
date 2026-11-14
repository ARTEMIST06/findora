import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  ExternalLink,
  ArrowRight,
  TrendingDown,
  Layers,
  Pause,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useFindoraStore } from '../../services/store';
import { formatINR } from '../../utils/formatters';
import { ProductWithPrices } from '../../types';
import { getProductImage, handleImageFallback } from '../../utils/visualAssets';

interface LiveEngineProps {
  onNavigate: (route: string) => void;
  variant?: 'hero' | 'compact';
  className?: string;
}

export const LiveEngine: React.FC<LiveEngineProps> = ({
  onNavigate,
  variant = 'hero',
  className = '',
}) => {
  const store = useFindoraStore();
  const allProducts = store.getAllProductsWithPrices(true);

  // Filter valid published products with prices and at least one image
  const eligibleProducts = allProducts.filter(
    (p) => p.published !== false && p.images && p.images.length > 0
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const totalProducts = eligibleProducts.length;

  // Stable references for rotation across renders without recreating listeners or resetting intervals
  const totalProductsRef = useRef(totalProducts);
  totalProductsRef.current = totalProducts;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Safe active product
  const activeProduct: ProductWithPrices | undefined =
    totalProducts > 0 ? eligibleProducts[currentIndex % totalProducts] : undefined;

  // Reset index if product list shrinks
  useEffect(() => {
    if (totalProducts > 0 && currentIndex >= totalProducts) {
      setCurrentIndex(0);
    }
  }, [totalProducts, currentIndex]);

  // Next & Prev navigation with direction tracking
  const handleNext = useCallback(() => {
    const total = totalProductsRef.current;
    if (total <= 1) return;
    setSlideDirection('right');
    setCurrentIndex((prev) => (prev + 1) % total);
  }, []);

  const handlePrev = useCallback(() => {
    const total = totalProductsRef.current;
    if (total <= 1) return;
    setSlideDirection('left');
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, []);

  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  const handleDotClick = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setSlideDirection(index > currentIndex ? 'right' : 'left');
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  // Continuous Auto-rotation every 4 seconds - stable interval across renders
  useEffect(() => {
    if (isPaused || totalProducts <= 1) return;

    const interval = setInterval(() => {
      handleNextRef.current();
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, totalProducts <= 1]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

    // Only swipe if horizontal move was greater than vertical and exceeds threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Graceful Zero Products State
  if (totalProducts === 0) {
    return (
      <div
        className={`w-full rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#0C1222] via-[#080D1A] to-[#050811] p-5 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-xl ${className}`}
        id="live-engine-empty"
      >
        <div className="flex items-center justify-between z-10 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Spotlight
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            EMPTY
          </span>
        </div>

        <div className="py-12 sm:py-16 text-center z-10 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-600">
            <Layers className="w-7 h-7 animate-pulse" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
            Nothing to feature yet
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
            No published products with images right now. Add products in the Admin panel and they will appear here.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
          <span>Findora Spotlight</span>
          <span className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Amazon India offers
          </span>
        </div>
      </div>
    );
  }

  // Animation variants
  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        initial: {
          opacity: 0,
          x: slideDirection === 'right' ? 24 : -24,
          scale: 0.98,
        },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        },
        exit: {
          opacity: 0,
          x: slideDirection === 'right' ? -20 : 20,
          scale: 0.98,
          transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
        },
      };

  // Windowed visible dots (up to 6) dynamically centered around currentIndex
  const maxVisibleDots = Math.min(totalProducts, 6);
  let startDot = Math.max(0, currentIndex - Math.floor(maxVisibleDots / 2));
  if (startDot + maxVisibleDots > totalProducts) {
    startDot = Math.max(0, totalProducts - maxVisibleDots);
  }
  const visibleDotIndices = Array.from({ length: maxVisibleDots }, (_, i) => startDot + i);

  const bestOffer = activeProduct?.offers?.[0];
  const productImage = getProductImage(activeProduct);

  return (
    <div
      className={`w-full rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#0C1222]/95 via-[#080D1A]/95 to-[#050811]/95 shadow-2xl relative overflow-hidden backdrop-blur-xl group transition-all duration-300 hover:border-blue-500/40 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      id="findora-spotlight"
    >
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Top Header Bar */}
      <div className="relative z-10 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-slate-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span>Spotlight</span>
            <span className="text-[10px] font-bold text-amber-600 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
              FEATURED
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause/Play indicator badge */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 flex items-center gap-1 transition-colors"
            title={isPaused ? 'Resume auto-rotation' : 'Pause rotation'}
            aria-label={isPaused ? 'Resume rotation' : 'Pause rotation'}
          >
            {isPaused ? <Play className="w-2.5 h-2.5 text-blue-600" /> : <Pause className="w-2.5 h-2.5" />}
            <span className="hidden xs:inline">{isPaused ? 'Paused' : 'Auto'}</span>
          </button>

          {/* Product counter badge */}
          <span className="text-[11px] font-mono text-slate-600 px-2 py-0.5 rounded-full bg-white border border-slate-200">
            {currentIndex + 1} <span className="text-slate-600">/</span> {totalProducts}
          </span>
        </div>
      </div>

      {/* Active Rotating Product Content Stage */}
      <div className="relative z-10 p-4 sm:p-6 min-h-[260px] sm:min-h-[300px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {activeProduct && (
            <motion.div
              key={activeProduct.id}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col justify-between flex-1 cursor-pointer"
              onClick={() => onNavigate(`/product/${activeProduct.slug}`)}
            >
              {/* Product Info & Visual Grid */}
              <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Left/Top: Product Image Box */}
                <div className="col-span-5 sm:col-span-5 relative">
                  <div className="relative aspect-square w-full rounded-2xl bg-white p-3 border border-slate-200/90 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-blue-500/30 transition-colors">
                    {/* Discount badge on image */}
                    {activeProduct.maxDiscountPercent && activeProduct.maxDiscountPercent > 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500 text-slate-900 shadow-md flex items-center gap-0.5 z-10">
                        <Tag className="w-2.5 h-2.5" />
                        {activeProduct.maxDiscountPercent}%
                      </span>
                    )}

                    <img
                      src={productImage}
                      alt={activeProduct.name}
                      onError={(e) => handleImageFallback(e, activeProduct.category)}
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Right/Bottom: Product Details */}
                <div className="col-span-7 sm:col-span-7 flex flex-col justify-center text-left min-w-0">
                  {/* Brand & Category pill */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      {activeProduct.brand}
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-[10px] font-medium text-slate-600 capitalize truncate max-w-[100px]">
                      {activeProduct.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors mb-2.5">
                    {activeProduct.name}
                  </h3>

                  {/* Pricing Display */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Price on Amazon
                    </span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        {activeProduct.lowestPrice ? (
                          formatINR(activeProduct.lowestPrice)
                        ) : (
                          <span className="text-sm text-slate-600">Check Price</span>
                        )}
                      </span>
                      {bestOffer?.originalPrice &&
                        bestOffer.originalPrice > (activeProduct.lowestPrice || 0) && (
                          <span className="text-xs text-slate-600 line-through font-medium">
                            {formatINR(bestOffer.originalPrice)}
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Best Store Badge */}
                  {activeProduct.bestStore && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-600 uppercase tracking-wider">At</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-emerald-600">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {activeProduct.bestStore.name.replace(' India', '')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Single verified offer — Findora lists Amazon India only. */}
              <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Amazon India · Verified offer
                  </span>
                </div>

                <span className="text-xs font-semibold text-blue-600 hover:text-blue-300 flex items-center gap-1 shrink-0 ml-auto group-hover:translate-x-0.5 transition-transform">
                  <span>View details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls Strip: Prev / Indicators / Next */}
      <div className="relative z-10 px-4 sm:px-6 py-3 bg-[#050811]/90 border-t border-slate-200/80 flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={totalProducts <= 1}
          className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-90"
          aria-label="Previous live product"
          title="Previous product"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Indicators ● ○ ○ ○ */}
        <div className="flex items-center gap-1.5">
          {visibleDotIndices.map((idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDotClick(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-sm shadow-blue-500/50'
                    : 'w-2 bg-slate-200 hover:bg-slate-500'
                }`}
                aria-label={`Jump to product ${idx + 1}`}
                aria-current={isActive ? 'true' : 'false'}
              />
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={totalProducts <= 1}
          className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-90"
          aria-label="Next live product"
          title="Next product"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
