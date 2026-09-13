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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white pt-8 pb-12 px-4 sm:px-6">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs sm:text-sm font-semibold mb-6 shadow-xs backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Smart Shopper Intelligence Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
          Find it. Compare it.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
            Buy smarter.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Stop hopping between tabs. Findora compares verified prices, coupons, and historical price drops
          across <span className="text-white font-medium">Amazon</span>,{' '}
          <span className="text-white font-medium">Flipkart</span>,{' '}
          <span className="text-white font-medium">Croma</span>, and{' '}
          <span className="text-white font-medium">Reliance Digital</span> in one instant search.
        </p>

        {/* Big Search Bar */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center p-1.5 sm:p-2 bg-white rounded-2xl shadow-2xl border border-slate-200/20 text-slate-900"
          >
            <div className="pl-3 sm:pl-4 pr-2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, models (e.g. Sony XM5, iPhone, RTX 4080)..."
              className="w-full py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
            <button
              type="submit"
              className="shrink-0 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-2"
            >
              <span>Compare</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Popular searches chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Trending:</span>
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => onNavigate(`/search?q=${encodeURIComponent(term)}`)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Social Proof / Metrics Bar */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-slate-800/80">
          <div className="text-center sm:text-left">
            <div className="text-xl sm:text-2xl font-extrabold text-white">4+ Stores</div>
            <div className="text-xs text-slate-400 mt-0.5">Amazon, Flipkart, Croma, Reliance</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">Up to 35%</div>
            <div className="text-xs text-slate-400 mt-0.5">Verified price drop savings</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xl sm:text-2xl font-extrabold text-blue-400">Zero Bias</div>
            <div className="text-xs text-slate-400 mt-0.5">Objective specs & pick reasons</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400">Direct Links</div>
            <div className="text-xs text-slate-400 mt-0.5">Zero added markups or hidden fees</div>
          </div>
        </div>
      </div>
    </section>
  );
};
