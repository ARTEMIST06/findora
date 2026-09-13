import React from 'react';
import { Scale, ArrowRight, Check, X, ShieldCheck } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useFindoraStore } from '../../services/store';

interface ComparisonHighlightProps {
  onNavigate: (route: string) => void;
}

export const ComparisonHighlight: React.FC<ComparisonHighlightProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const p1 = store.getProductWithPrices('apple-iphone-16-pro-128gb');
  const p2 = store.getProductWithPrices('samsung-galaxy-s25-ultra-256gb');

  if (!p1 || !p2) return null;

  return (
    <section className="py-8 sm:py-12 bg-slate-900 text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              <span>Head-to-Head Comparison</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              The Flagship Showdown: iPhone 16 Pro vs S25 Ultra
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
              Compare cameras, silicon benchmark speeds, battery life, and store pricing side-by-side.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/compare')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 shrink-0"
          >
            <span>Open Full Comparison Tool</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-side card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product 1: iPhone 16 Pro */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  {p1.brand}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-900/60 text-blue-300 font-semibold border border-blue-700/60">
                  {p1.badge || 'Editor Pick'}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={p1.images[0]}
                  alt={p1.name}
                  className="w-20 h-20 object-contain rounded-xl bg-slate-900/50 p-2 border border-slate-700/60"
                />
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
                    {p1.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-emerald-400">
                      {formatINR(p1.lowestPrice)}
                    </span>
                    {p1.bestStore && (
                      <span className="text-xs text-slate-400">at {p1.bestStore.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Processor:</span>
                  <span className="font-semibold text-white">Apple A18 Pro (3nm)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Display:</span>
                  <span className="font-semibold text-white">6.3" ProMotion 120Hz</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Video Capture:</span>
                  <span className="font-semibold text-white">4K 120fps Dolby Vision</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Material:</span>
                  <span className="font-semibold text-white">Grade 5 Titanium</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">{p1.offers.length} verified store offers</span>
              <button
                onClick={() => onNavigate(`/product/${p1.slug}`)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>View Store Prices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Product 2: Galaxy S25 Ultra */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {p2.brand}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-300 font-semibold border border-indigo-700/60">
                  {p2.badge || 'Android Flagship'}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={p2.images[0]}
                  alt={p2.name}
                  className="w-20 h-20 object-contain rounded-xl bg-slate-900/50 p-2 border border-slate-700/60"
                />
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
                    {p2.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-emerald-400">
                      {formatINR(p2.lowestPrice)}
                    </span>
                    {p2.bestStore && (
                      <span className="text-xs text-slate-400">at {p2.bestStore.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Processor:</span>
                  <span className="font-semibold text-white">Snapdragon 8 Elite</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Display:</span>
                  <span className="font-semibold text-white">6.8" Anti-Reflective Armor</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Camera / Zoom:</span>
                  <span className="font-semibold text-white">200MP + 100x Space Zoom</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Productivity:</span>
                  <span className="font-semibold text-white">Integrated S-Pen Stylus</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">{p2.offers.length} verified store offers</span>
              <button
                onClick={() => onNavigate(`/product/${p2.slug}`)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>View Store Prices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
