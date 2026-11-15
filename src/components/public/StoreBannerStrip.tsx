import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface StoreBannerStripProps {
  onNavigate: (route: string) => void;
}

export const StoreBannerStrip: React.FC<StoreBannerStripProps> = ({ onNavigate }) => {
  // NOTE: Findora currently lists Amazon India only. Other stores are NOT tracked
  // yet — do not re-add them here until a real offer feed exists for each one.
  const brands = [
    { name: 'Amazon', badge: 'Verified Offers', color: 'bg-black', text: 'text-white' },
  ];

  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="rounded-none border border-slate-200 bg-white p-5 sm:p-8 relative overflow-hidden">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>One Store, Verified Deals</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold uppercase text-black tracking-tight">
              Top Picks. Verified Prices. All in One Place.
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-xl">
              Every product links to one verified Amazon India offer — checked by our team, with the price and last-verified date shown.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/products')}
            className="shrink-0 px-5 py-2.5 rounded-none bg-black hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm border border-black transition-all flex items-center gap-2 self-start md:self-auto"
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
              className="group p-3.5 rounded-none bg-white border border-slate-200 hover:border-black transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center"
            >
              <div className={`w-8 h-8 rounded-xl ${brand.color} border border-white/10 flex items-center justify-center mb-1.5 transition-transform duration-300 group-hover:scale-110`}>
                <span className={`text-xs font-black ${brand.text}`}>
                  {brand.name.slice(0, 1)}
                </span>
              </div>
              <span className="text-xs font-extrabold text-black transition-colors">
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
