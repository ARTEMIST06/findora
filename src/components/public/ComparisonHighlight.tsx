import React from 'react';
import { Scale, ArrowRight } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useFindoraStore } from '../../services/store';

interface ComparisonHighlightProps {
  onNavigate: (route: string) => void;
}

export const ComparisonHighlight: React.FC<ComparisonHighlightProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  
  // Dynamically select two top-tier products for the comparison highlight
  const p1 = products.find(p => p.lowestPrice > 80000 && p.category === 'smartphones') || products[0];
  const p2 = products.find(p => p.id !== p1?.id && p.lowestPrice > 80000 && p.category === 'smartphones') || products[1];

  if (!p1 || !p2) return null;

  return (
    <section className="py-12 sm:py-16 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              <Scale className="w-4 h-4 text-blue-400" />
              <span>Head-to-Head Comparison</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Compare Top Picks Side-by-Side
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl">
              Don't guess. Compare prices, features, and historical drops to make the smartest purchasing decision.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/compare')}
            className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm transition-all shadow-lg flex items-center gap-2 shrink-0"
          >
            <span>Open Comparison Tool</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-side card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[p1, p2].map((p, idx) => (
            <div key={p.id} className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm flex flex-col justify-between hover:bg-slate-800/60 transition-colors duration-300">
              <div>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {p.brand}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 font-medium border border-slate-600/50">
                    {p.badge || (idx === 0 ? 'Popular' : 'Trending')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
                  <div className="w-24 h-24 shrink-0 rounded-2xl bg-white p-2 border border-slate-700/60 shadow-inner flex items-center justify-center">
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                      alt={p.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-snug line-clamp-2">
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-extrabold text-white">
                        {formatINR(p.lowestPrice)}
                      </span>
                      {p.bestStore && (
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">at {p.bestStore.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Highlights */}
                <div className="space-y-3 text-xs text-slate-300 border-t border-slate-700/60 pt-5">
                   <p className="line-clamp-3 text-slate-400 leading-relaxed">
                     {p.shortDescription || 'No description available for this product. Check full details on the product page.'}
                   </p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{p.offers.length} verified store offers</span>
                <button
                  onClick={() => onNavigate(`/product/${p.slug}`)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
