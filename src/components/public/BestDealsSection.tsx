import React from 'react';
import { Flame, ArrowRight, TrendingDown, Tag } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';

interface BestDealsSectionProps {
  onNavigate: (route: string) => void;
}

export const BestDealsSection: React.FC<BestDealsSectionProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);

  // Filter products with highest discount percentage
  const deals = products
    .filter((p) => p.maxDiscountPercent && p.maxDiscountPercent > 0)
    .sort((a, b) => (b.maxDiscountPercent || 0) - (a.maxDiscountPercent || 0))
    .slice(0, 6);

  if (deals.length === 0) return null;

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Aggressive Discounts</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Prices Worth Checking Today
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Highest price reductions compared against 90-day market averages.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/deals')}
          className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group self-start sm:self-auto"
        >
          <span>Explore all deals</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {deals.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};
