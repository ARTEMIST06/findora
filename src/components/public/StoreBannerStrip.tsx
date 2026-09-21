import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface StoreBannerStripProps {
  onNavigate: (route: string) => void;
}

export const StoreBannerStrip: React.FC<StoreBannerStripProps> = ({ onNavigate }) => {
  const brands = [
    { name: 'Amazon', badge: 'Prime Verified', color: 'from-amber-500/20 to-orange-500/10', text: 'text-amber-400' },
    { name: 'Flipkart', badge: 'SuperCoins', color: 'from-blue-500/20 to-sky-500/10', text: 'text-blue-400' },
    { name: 'Croma', badge: 'Tata Assurance', color: 'from-teal-500/20 to-emerald-500/10', text: 'text-teal-400' },
    { name: 'Reliance Digital', badge: 'InstaDelivery', color: 'from-red-500/20 to-rose-500/10', text: 'text-rose-400' },
    { name: 'Vijay Sales', badge: 'Best Store Deals', color: 'from-indigo-500/20 to-purple-500/10', text: 'text-indigo-400' },
    { name: 'Tata CLiQ', badge: 'Luxury & Tech', color: 'from-purple-500/20 to-pink-500/10', text: 'text-purple-400' },
    { name: 'AJIO', badge: 'Fashion Tech', color: 'from-emerald-500/20 to-cyan-500/10', text: 'text-emerald-400' },
    { name: 'Nykaa', badge: 'Authentic 100%', color: 'from-pink-500/20 to-rose-500/10', text: 'text-pink-400' },
  ];

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-[#0C1222] via-[#090F1E] to-[#070B14] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle atmospheric ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Merchant Intelligence</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Top Brands. Best Prices. All in One Place.
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              We continuously track live catalogs, flash promotions, and lightning deals across India's largest verified retail networks.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/products')}
            className="shrink-0 px-5 py-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 self-start md:self-auto hover:border-blue-500/40"
          >
            <span>Explore All Brands</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Store Brand Logos / Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-8 relative z-10">
          {brands.map((brand) => (
            <div
              key={brand.name}
              onClick={() => onNavigate(`/products?q=${encodeURIComponent(brand.name)}`)}
              className="group p-3.5 rounded-2xl bg-[#070B14]/80 hover:bg-[#0D1527] border border-slate-800/80 hover:border-blue-500/40 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-md"
            >
              <span className="text-xs font-extrabold text-white group-hover:text-blue-300 transition-colors">
                {brand.name}
              </span>
              <span className={`text-[10px] font-medium mt-1 ${brand.text}`}>
                {brand.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
