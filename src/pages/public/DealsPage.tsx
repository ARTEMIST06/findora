import React, { useState } from 'react';
import { Flame, Tag, ArrowUpDown, Filter, ShieldCheck, Sparkles } from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';

interface DealsPageProps {
  onNavigate: (route: string) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const allProducts = store.getAllProductsWithPrices(true);

  const [minDiscount, setMinDiscount] = useState<number>(10);

  const deals = allProducts
    .filter((p) => p.maxDiscountPercent && p.maxDiscountPercent >= minDiscount)
    .sort((a, b) => (b.maxDiscountPercent || 0) - (a.maxDiscountPercent || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <SEOHead
        title="Best Deals & Biggest Discounts | Findora"
        description="Biggest discounts vs MRP on Amazon India — earbuds, fashion, home & kitchen, appliances and more, checked by the Findora team."
        canonicalPath="/deals"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Deals', url: '/deals' }
        ]}
      />
      {/* Header */}
      <div className="pb-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-widest mb-1.5 bg-black/5 px-3 py-1 rounded-full border border-black/10">
            <Flame className="w-3.5 h-3.5 fill-black text-black" />
            <span>Biggest Discounts vs MRP</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Top Deals & Maximum Savings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Discounts are the gap between the stored Amazon India price and its MRP — nothing inflated, nothing invented.
          </p>
        </div>

        {/* Filter by discount tier */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">Discount:</span>
          <div className="inline-flex rounded-full bg-white p-1 border border-slate-200">
            {[5, 10, 15, 20].map((disc) => (
              <button
                key={disc}
                onClick={() => setMinDiscount(disc)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  minDiscount === disc
                    ? 'bg-black text-white shadow-md shadow-black/10 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {disc}%+ Off
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      {deals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white/80 rounded-none border border-slate-200/80 p-8 shadow-xl">
          <p className="text-slate-600 text-sm">
            No deals found with {minDiscount}%+ discount right now.
          </p>
          <button
            onClick={() => setMinDiscount(5)}
            className="mt-4 px-6 py-2.5 bg-black text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-all shadow-md shadow-black/10"
          >
            Show all available deals
          </button>
        </div>
      )}
    </div>
  );
};
