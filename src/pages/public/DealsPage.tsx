import React, { useState } from 'react';
import { Flame, Tag, ArrowUpDown, Filter, ShieldCheck } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <SEOHead 
        title="Best Deals & Verified Price Drops - Findora"
        description="Discover the highest discounts and verified price drops on premium electronics, smartphones, laptops, and audio gear across top stores."
      />
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Today's Verified Price Drops</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Top Deals & Maximum Savings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real discount calculations based on authentic MRP and recent merchant price tracking.
          </p>
        </div>

        {/* Filter by discount tier */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Discount:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[5, 10, 15, 20].map((disc) => (
              <button
                key={disc}
                onClick={() => setMinDiscount(disc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  minDiscount === disc
                    ? 'bg-white text-slate-900 shadow-xs'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">
            No deals found with {minDiscount}%+ discount right now.
          </p>
          <button
            onClick={() => setMinDiscount(5)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Show all available deals
          </button>
        </div>
      )}
    </div>
  );
};
