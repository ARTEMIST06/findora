import React, { useState } from 'react';
import { Search, ArrowRight, Sparkles, Tag, Zap, ShieldCheck, HeartHandshake, TrendingUp, CheckCircle2 } from 'lucide-react';

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

  const popularSearches = [
    { label: 'laptop', query: 'laptop' },
    { label: 'air fryer', query: 'air fryer' },
    { label: 'headphones', query: 'headphones' },
    { label: 'smartwatch', query: 'smartwatch' },
    { label: 'iPhone', query: 'iPhone' },
    { label: 'monitor', query: 'monitor' },
  ];

  const valueProps = [
    {
      icon: Tag,
      title: 'Compare Prices',
      subtitle: 'Across top stores',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: Zap,
      title: 'Save Time',
      subtitle: 'No more endless searching',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Trusted Picks',
      subtitle: 'Only the best, always.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: HeartHandshake,
      title: 'Built for You',
      subtitle: 'Smarter tools. Better choices.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <section className="relative overflow-hidden pt-6 sm:pt-10 pb-14 sm:pb-20 px-4 sm:px-6">
      {/* Background Atmospheric Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text, Search, Popular Searches & Value Props */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wide mb-6 w-fit shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SMART SHOPPING. REAL SAVINGS.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] mb-6">
              Find it.
              <br />
              Compare it.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Buy smarter.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mb-8 leading-relaxed font-normal">
              Discover the best products, compare prices across top stores and make confident buying decisions — all in one place.
            </p>

            {/* Big Capsule Search Bar */}
            <div className="max-w-xl mb-6">
              <form
                onSubmit={handleSearch}
                className="relative flex items-center bg-white rounded-full p-1.5 sm:p-2 shadow-2xl shadow-blue-900/30 border border-white/20 transition-all focus-within:ring-4 focus-within:ring-blue-500/20"
              >
                <div className="pl-3.5 pr-2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, brands or categories..."
                  className="w-full py-2.5 sm:py-3 text-slate-900 placeholder-slate-400 text-sm sm:text-base outline-none bg-transparent font-medium"
                />
                <button
                  type="submit"
                  className="shrink-0 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Popular Searches Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs mb-10">
              <span className="text-slate-400 font-medium mr-1">Popular searches:</span>
              {popularSearches.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(`/search?q=${encodeURIComponent(item.query)}`)}
                  className="px-3 py-1.5 rounded-full bg-[#0D1322] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-blue-500/40 transition-all shadow-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 4 Value Proposition Items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
              {valueProps.map((prop) => {
                const IconComponent = prop.icon;
                return (
                  <div key={prop.title} className="flex flex-col gap-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${prop.bg} ${prop.color} mb-1`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {prop.title}
                    </span>
                    <span className="text-[11px] text-slate-400 leading-snug">
                      {prop.subtitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Premium Ambient Tech Still Life Composition */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Outer Ambient Glow Container */}
            <div className="relative w-full aspect-[4/3] sm:aspect-square max-w-[520px] rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-gradient-to-br from-[#0C1222] via-[#080D1A] to-[#050811] p-6 flex flex-col justify-between group">
              
              {/* Top ambient badge overlay */}
              <div className="flex items-center justify-between z-10">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                  BETTER PRODUCTS A BRIGHTER YOU
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  LIVE ENGINE
                </span>
              </div>

              {/* Central Tech Showcase Collage */}
              <div className="relative my-auto flex items-center justify-center py-6">
                {/* Visual Ambient Light Backdrop */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-indigo-600/10 to-transparent rounded-2xl blur-xl"></div>
                
                {/* Tech Still Life Photo */}
                <img
                  src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1200"
                  alt="Findora Tech Workspace & Hardware Discovery"
                  className="relative z-0 w-full h-56 sm:h-64 object-cover rounded-2xl border border-slate-700/60 shadow-2xl filter brightness-95 contrast-105"
                />

                {/* Floating Glassmorphic Insights Card */}
                <div className="absolute -bottom-4 -right-2 sm:right-2 z-10 p-3.5 rounded-2xl bg-[#070B14]/90 backdrop-blur-xl border border-white/15 shadow-2xl text-left max-w-[210px] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Top Deals</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-auto">Daily</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Multiple Stores</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-auto">1-Click</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Real Insights</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-auto">Smart</span>
                  </div>
                  <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                    FINDORA VERIFIED
                  </div>
                </div>
              </div>

              {/* Bottom Strip */}
              <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-white font-medium">Tracking 50,000+ Deals</span>
                </div>
                <button
                  onClick={() => onNavigate('/deals')}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <span>Explore Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
