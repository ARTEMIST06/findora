import React from 'react';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';

interface RecentlyAddedProps {
  onNavigate: (route: string) => void;
}

export const RecentlyAdded: React.FC<RecentlyAddedProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Latest Arrivals</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Newly Discovered Products
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Freshly indexed prices, specs, and coupons across verified partner stores.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/products')}
          className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group self-start sm:self-auto"
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
