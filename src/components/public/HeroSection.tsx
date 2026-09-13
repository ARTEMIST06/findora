import React, { useState } from 'react';
import { Search, ArrowRight, TrendingUp, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { Logo } from '../brand/Logo';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      onNavigate('/products');
    }
  };

  const trendingSearches = [
    'iPhone 16 Pro',
    'MacBook Air M3',
    'Sony WH-1000XM5',
    'Galaxy S25 Ultra',
    'AirPods Pro 2',
    'LG OLED C4',
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white pt-6 pb-8 px-4 sm:px-6">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-32 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs font-semibold mb-4 shadow-xs backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Smart Shopper Intelligence Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
          Find it. Compare it.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
            Buy smarter.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Stop hopping between tabs. Findora compares verified prices, coupons, and historical price drops
          in one instant search.
        </p>

        {/* Big Search Bar */}
        <div className="mt-6 sm:mt-8 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center p-1 sm:p-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/20 text-slate-900"
          >
            <div className="pl-3 sm:pl-4 pr-2 text-slate-400">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, models..."
              className="w-full py-2 sm:py-2.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
            <button
              type="submit"
              className="shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-blue-500/25 flex items-center gap-1.5"
            >
              <span>Compare</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Popular searches chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs">
            <span className="text-slate-400 font-medium">Trending:</span>
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => onNavigate(`/search?q=${encodeURIComponent(term)}`)}
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Value Proposition Banners */}
        <div className="mt-8 sm:mt-10 max-w-3xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-left">
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-snug">
              Real-time<br/><span className="text-white">Price Engine</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-snug">
              Historical<br/><span className="text-white">Drop Alerts</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-snug">
              Verified<br/><span className="text-white">Coupons</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-snug">
              Objective<br/><span className="text-white">Hardware Specs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
