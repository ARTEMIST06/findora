import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';
import { useIsMobile } from '../../hooks/useIsMobile';

interface RecentlyAddedProps {
  onNavigate: (route: string) => void;
}

export const RecentlyAdded: React.FC<RecentlyAddedProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  // Phones show 4 newest instead of 8 — same scroll saving as Trending.
  const isMobile = useIsMobile();

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, isMobile ? 4 : 8);

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-6">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Latest Arrivals
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-black tracking-tight">
            Newly Discovered Products
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            Freshly indexed prices and specs, with verified Amazon India offers.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/products')}
          className="text-xs sm:text-sm font-semibold text-black hover:text-slate-700 flex items-center gap-1 group self-start sm:self-auto py-1"
        >
          <span>View all {products.length} products</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recentProducts.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};
