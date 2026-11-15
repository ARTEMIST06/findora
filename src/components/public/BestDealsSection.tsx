import React from 'react';
import { Flame, ArrowRight, TrendingDown, Tag } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';
import { useIsMobile } from '../../hooks/useIsMobile';

interface BestDealsSectionProps {
  onNavigate: (route: string) => void;
}

export const BestDealsSection: React.FC<BestDealsSectionProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  // Phones show 4 deals instead of 6 — same scroll saving as Trending.
  const isMobile = useIsMobile();

  // Filter products with highest discount percentage
  const deals = products
    .filter((p) => p.maxDiscountPercent && p.maxDiscountPercent > 0)
    .sort((a, b) => (b.maxDiscountPercent || 0) - (a.maxDiscountPercent || 0))
    .slice(0, isMobile ? 4 : 6);

  if (deals.length === 0) return null;

  return (
    <section className="py-5 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-widest mb-1 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
            <span>Aggressive Discounts</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Prices Worth Checking Today
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Biggest savings vs MRP on Amazon India — the discount is the gap between the stored price and its MRP.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/deals')}
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto py-1"
        >
          <span>Explore all deals</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 sm:gap-5">
        {deals.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};
