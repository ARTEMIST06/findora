import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';
import { analytics } from '../../services/analytics';
import { Reveal } from '../common/Reveal';
import { useIsMobile } from '../../hooks/useIsMobile';

interface TrendingProductsProps {
  onNavigate: (route: string) => void;
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  const [page, setPage] = useState(0);
  // Phones show 4 cards per page instead of 6: three stacked product
  // sections are the homepage's biggest scroll cost on mobile.
  const isMobile = useIsMobile();
  // CategoryShowcase renders nothing until the live Firestore snapshot
  // arrives — Trending used to render straight from the localStorage cache
  // in that window, so it flashed under the hero before the categories
  // appeared. Show a skeleton in the same shape until live data lands.
  const liveSynced = store.hasLiveProducts();

  // Ranked by real engagement (recorded Amazon clicks + recorded product
  // views from this browser). No invented views: with no engagement data
  // yet, newest first — never a fixed arbitrary slice of the catalogue.
  const trendingList = useMemo(() => {
    const clicks = store.getAffiliateClicks();
    const perf = analytics.getProductPerformanceData(products, clicks, []);
    const score = new Map(perf.map((p) => [p.productId, p.amazonClicks * 3 + p.views]));
    const hasSignal = [...score.values()].some((s) => s > 0);
    const sorted = [...products].sort((a, b) => {
      if (hasSignal) return (score.get(b.id) || 0) - (score.get(a.id) || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return sorted.slice(0, 12);
  }, [products, store]);

  const pageSize = isMobile ? 4 : 6;
  const maxPages = Math.ceil(trendingList.length / pageSize);
  const displayedProducts = trendingList.slice(page * pageSize, (page + 1) * pageSize);

  // Clamp the page when the page size changes (e.g. rotating a phone).
  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, maxPages - 1)));
  }, [maxPages]);

  if (!liveSynced) {
    return (
      <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6" aria-hidden="true">
        <div className="mb-5 sm:mb-6">
          <div className="h-3 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 sm:h-12 w-72 max-w-full bg-slate-200 rounded mt-3 animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-slate-200 rounded mt-3 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="aspect-square bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-3 w-3/4 bg-slate-200 rounded mt-3 animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-200 rounded mt-2 animate-pulse" />
              <div className="h-8 w-full bg-slate-200 rounded-lg mt-4 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (trendingList.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Most clicked right now
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-black tracking-tight">
              Trending Deals
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              What shoppers are actually opening — ranked by real clicks and views.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('/deals')}
              className="text-xs sm:text-sm font-semibold text-black hover:text-slate-700 flex items-center gap-1.5 transition-colors group py-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {maxPages > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(maxPages - 1, p + 1))}
                  disabled={page >= maxPages - 1}
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 sm:gap-5">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </Reveal>
    </section>
  );
};
