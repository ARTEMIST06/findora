import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Sparkles,
  Tag,
  Zap,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { LiveEngine } from './LiveEngine';
import { useFindoraStore } from '../../services/store';
import { useIsMobile } from '../../hooks/useIsMobile';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const store = useFindoraStore();
  const isMobile = useIsMobile();
  // The count is quoted only after the first live Firestore snapshot —
  // before that the list can be a stale cache (28 products from before the
  // drafts publish) and the pill would briefly show the wrong number.
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

  // Only terms that return real products on Findora — no iPhone / laptop /
  // monitor (the catalogue has none of those).
  const popularSearches = [
    { label: 'earbuds', query: 'earbuds' },
    { label: 'air fryer', query: 'air fryer' },
    { label: 'smartwatch', query: 'smartwatch' },
    { label: 'power bank', query: 'power bank' },
    { label: 'kurta', query: 'kurta' },
    { label: 'bedsheet', query: 'bedsheet' },
  ];

  const valueProps = [
    {
      icon: Tag,
      title: 'Compare Prices',
      subtitle: 'On Amazon India',
      color: 'text-blue-600',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: Zap,
      title: 'Save Time',
      subtitle: 'No endless searching',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Prices',
      subtitle: 'Checked on Amazon India',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: HeartHandshake,
      title: 'No Sponsored Picks',
      subtitle: 'Editorial choices only',
      color: 'text-purple-600',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <section className="relative overflow-hidden pt-4 sm:pt-8 pb-6 sm:pb-16 px-4 sm:px-6">
      {/* Background Atmospheric Glows & Cinematic Composition */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-blue-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-20 right-1/4 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-purple-600/12 rounded-full blur-[140px]"></div>

        {/* Subtle Cinematic Technology Composition (laptop, phone, audio, smartwatch, camera) */}
        <div
          className="absolute -top-10 right-0 w-full lg:w-3/5 h-full opacity-[0.06] lg:opacity-[0.14] mix-blend-screen bg-no-repeat bg-right-top bg-contain filter contrast-125 transition-opacity"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80')`,
          }}
        />
        {/* Contrast fade mask */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050811] via-[#050811]/90 to-transparent lg:w-2/3"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
          {/* Main Left Column (Desktop) / Primary Stack (Mobile) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs font-semibold tracking-wide mb-4 sm:mb-5 w-fit shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>
                {liveSynced && liveCount > 0
                  ? `${liveCount}+ VERIFIED PRODUCTS · AMAZON INDIA`
                  : 'SMART SHOPPING. REAL SAVINGS.'}
              </span>
            </div>

            {/* Main Headline - Responsive typography across 360px, 768px, 1024px, 1440px */}
            <h1 className="text-3xl sm:text-5xl lg:text-4xl xl:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] sm:leading-[1.08] mb-4 sm:mb-6">
              Find it.
              <br />
              Compare it.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">
                Buy smarter.
              </span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-slate-700 text-sm sm:text-base xl:text-lg max-w-xl mb-6 sm:mb-8 leading-relaxed font-normal">
              Discover the best products, check verified Amazon India prices and make confident buying decisions — all in one place.
            </p>

            {/* Big Capsule Search Bar */}
            <div className="w-full max-w-xl mb-4 sm:mb-5">
              <form
                onSubmit={handleSearch}
                className="relative flex items-center bg-white rounded-full p-1.5 sm:p-2 shadow-2xl shadow-blue-900/30 border border-slate-300 transition-all focus-within:ring-4 focus-within:ring-blue-500/20"
              >
                <div className="pl-3 pr-2 text-slate-600">
                  <Search className="w-4 sm:w-5 h-4 sm:h-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands or categories..."
                  className="w-full py-2 sm:py-2.5 text-slate-900 placeholder-slate-400 text-xs sm:text-sm md:text-base outline-none bg-transparent font-medium"
                />
                <button
                  type="submit"
                  className="shrink-0 px-4 sm:px-7 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <span>Search</span>
                  <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </form>
            </div>

            {/* Popular Searches Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs mb-6 lg:mb-8">
              <span className="text-slate-600 font-medium mr-1 text-[11px] sm:text-xs">
                Popular searches:
              </span>
              {popularSearches.slice(0, isMobile ? 4 : 6).map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(`/search?q=${encodeURIComponent(item.query)}`)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300/80 hover:border-blue-500/40 transition-all shadow-sm text-[11px] sm:text-xs"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* MOBILE ONLY: Live Engine inserted right after popular searches before benefits */}
            <div className="lg:hidden mb-6">
              <LiveEngine onNavigate={onNavigate} variant="compact" />
            </div>

            {/* 4 Value Proposition Items (Benefits) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200/80">
              {valueProps.map((prop) => {
                const IconComponent = prop.icon;
                return (
                  <div key={prop.title} className="flex flex-col gap-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border ${prop.bg} ${prop.color} mb-1`}
                    >
                      <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                      {prop.title}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-600 leading-snug">
                      {prop.subtitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DESKTOP & LAPTOP ONLY: Live Engine in right column */}
          <div className="hidden lg:flex lg:col-span-5 relative items-center justify-center">
            {/* Ambient Backlight Halo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-70 pointer-events-none"></div>
            <LiveEngine onNavigate={onNavigate} variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
};
