import React from 'react';
import { Scale, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useFindoraStore } from '../../services/store';

interface ComparisonHighlightProps {
  onNavigate: (route: string) => void;
}

export const ComparisonHighlight: React.FC<ComparisonHighlightProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  
  // Dynamically select two top-tier products for the comparison highlight
  const p1 = products.find(p => p.lowestPrice > 60000 && p.category === 'smartphones') || products[0];
  const p2 = products.find(p => p.id !== p1?.id && p.lowestPrice > 60000 && p.category === 'smartphones') || products[1];

  if (!p1 || !p2) return null;

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 relative">
      <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#0D1426] via-[#090E1C] to-[#070B14] p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        {/* Glow ambient circle */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Head-to-Head Comparison</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Compare Top Picks Side-by-Side
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
              Eliminate guesswork. Compare verified prices, specifications, and savings to make the smartest purchasing decision.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/compare')}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span>Launch Comparison Tool</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-side comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {[p1, p2].map((p, idx) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-[#070B14]/80 border border-slate-800/90 backdrop-blur-md flex flex-col justify-between hover:border-blue-500/40 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">
                    {p.brand}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-semibold border border-slate-700">
                    {p.badge || (idx === 0 ? 'Editor Choice' : 'Flagship')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                  <div className="w-20 h-20 shrink-0 rounded-xl bg-[#0D1426] p-2 border border-slate-800 flex items-center justify-center">
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                      alt={p.name}
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-xl font-extrabold text-white">
                        {formatINR(p.lowestPrice)}
                      </span>
                      {p.bestStore && (
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Best at {p.bestStore.name.replace(' India', '')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Highlights */}
                <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                  <p className="line-clamp-2 leading-relaxed">
                    {p.shortDescription || 'Verified flagship product with comprehensive multi-store pricing history.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {p.offers.length} verified store offers
                </span>
                <button
                  onClick={() => onNavigate(`/product/${p.slug}`)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
