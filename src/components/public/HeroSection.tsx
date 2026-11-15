import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useFindoraStore } from '../../services/store';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const store = useFindoraStore();
  // The count is quoted only after the first live Firestore snapshot —
  // before that the list can be a stale cache and the eyebrow would show
  // the wrong number.
  const liveSynced = store.hasLiveProducts();
  const liveCount = store.getAllProductsWithPrices(true).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      onNavigate('/products');
    }
  };

  return (
    <section className="bg-white pt-10 sm:pt-16 pb-8 sm:pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto text-left">
        {/* Eyebrow — live catalogue size, plain grey caps (no pill) */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 sm:mb-6">
          {liveSynced && liveCount > 0
            ? `${liveCount}+ verified products · Amazon India`
            : 'Verified Amazon India deals'}
        </p>

        {/* Giant editorial headline — Findora's tagline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase text-black tracking-tight leading-[1.05] mb-4 sm:mb-6">
          We search.
          <br />
          You shop.
        </h1>

        {/* One small grey subline */}
        <p className="text-sm sm:text-base text-slate-500 max-w-xl mb-6 sm:mb-8 leading-relaxed">
          Discover the best products, check verified Amazon India prices and buy with confidence — all in one place.
        </p>

        {/* One large search — the site's core action */}
        <div className="w-full max-w-xl">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center bg-white border-2 border-black transition-all focus-within:ring-4 focus-within:ring-black/10"
          >
            <div className="pl-4 pr-2 text-black">
              <Search className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands or categories..."
              className="w-full py-3 sm:py-3.5 text-black placeholder-slate-400 text-sm sm:text-base outline-none bg-transparent font-medium"
            />
            <button
              type="submit"
              className="shrink-0 px-5 sm:px-7 py-3 sm:py-3.5 bg-black hover:bg-slate-800 text-white font-semibold text-sm sm:text-base transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
