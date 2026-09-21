import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';

interface TrendingProductsProps {
  onNavigate: (route: string) => void;
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  const [page, setPage] = useState(0);

  // Get trending/featured products
  const trendingList = products.slice(0, 12);
  const pageSize = 6;
  const maxPages = Math.ceil(trendingList.length / pageSize);

  const displayedProducts = trendingList.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header matching reference screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-400">🔥</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Curated Selection
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trending Deals
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Handpicked products. Better prices. Happier you.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('/deals')}
            className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Pagination Controls */}
          {maxPages > 1 && (
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-full border border-slate-800 bg-[#0D1322] hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(maxPages - 1, p + 1))}
                disabled={page >= maxPages - 1}
                className="w-8 h-8 rounded-full border border-slate-800 bg-[#0D1322] hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 6 cards matching reference design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};
