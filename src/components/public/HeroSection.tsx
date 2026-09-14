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
    <section className="relative overflow-hidden bg-slate-900 text-white rounded-b-3xl sm:mx-2 mt-2 pt-12 pb-16 px-4 sm:px-6">
      {/* Background imagery / collage */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&q=80&w=2000" 
          alt="Premium Shopping Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent"></div>
      </div>

      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-blue-100 text-xs sm:text-sm font-medium mb-6 shadow-sm backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>The Modern Product Discovery Platform</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
          Find it. Compare it.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Buy smarter.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Stop hopping between tabs. Findora brings you the best verified prices, coupons, and historical price drops in one intelligent search.
        </p>

        {/* Big Search Bar */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center p-1.5 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 text-white focus-within:bg-white/15 focus-within:border-white/30 transition-all"
          >
            <div className="pl-4 pr-3 text-slate-300">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search smartphones, laptops, audio..."
              className="w-full py-3 text-sm sm:text-base text-white placeholder-slate-400 outline-none bg-transparent"
            />
            <button
              type="submit"
              className="shrink-0 px-6 sm:px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Popular searches chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Trending:</span>
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => onNavigate(`/search?q=${encodeURIComponent(term)}`)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors backdrop-blur-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
