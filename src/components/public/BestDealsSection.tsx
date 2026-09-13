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
    .slice(0, 4);

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-slate-100/60 to-white border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Verified Price Drops</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
              Today's Highest Discount Deals
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Active merchant promotions, card discounts, and seasonal clearance offers.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/deals')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Explore all deals</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </section>
  );
};
