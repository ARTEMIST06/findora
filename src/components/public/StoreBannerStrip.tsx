import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface StoreBannerStripProps {
  onNavigate: (route: string) => void;
}

export const StoreBannerStrip: React.FC<StoreBannerStripProps> = ({ onNavigate }) => {
  // NOTE: Findora currently lists Amazon India only. Other stores are NOT tracked
  // yet — do not re-add them here until a real offer feed exists for each one.
  const brands = [
    { name: 'Amazon', badge: 'Verified Offers', color: 'from-amber-500/20 to-orange-500/10', text: 'text-amber-600' },
  ];

  return (
    <section className="py-5 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle atmospheric ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>One Store, Verified Deals</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Top Picks. Verified Prices. All in One Place.
            </h3>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Every product links to one verified Amazon India offer — checked by our team, with the price and last-verified date shown.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/products')}
            className="shrink-0 px-5 py-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 self-start md:self-auto hover:border-blue-500/40"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Store Brand Logos / Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 mt-5 sm:mt-8 relative z-10">
          {brands.map((brand) => (
            <div
              key={brand.name}
              onClick={() => onNavigate(`/products?q=${encodeURIComponent(brand.name)}`)}
              className="group p-3.5 rounded-2xl bg-white/80 hover:bg-slate-50 border border-slate-200/80 hover:border-blue-500/40 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${brand.color} border border-white/5 flex items-center justify-center mb-1.5 transition-transform duration-300 group-hover:scale-110`}>
                <span className={`text-xs font-black ${brand.text}`}>
                  {brand.name.slice(0, 1)}
                </span>
              </div>
              <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                {brand.name}
              </span>
              <span className={`text-[10px] font-medium mt-0.5 ${brand.text}`}>
                {brand.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
