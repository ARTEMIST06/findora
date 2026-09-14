import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';

interface TrendingProductsProps {
  onNavigate: (route: string) => void;
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Trending</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            What's getting attention
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            The most searched and compared products right now.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/products')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
        >
          <span>See all {products.length} products</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};
