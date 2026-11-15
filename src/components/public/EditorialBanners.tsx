import React from 'react';
import { ArrowRight, Sparkles, Flame, Laptop, Home, Star } from 'lucide-react';
import { EDITORIAL_ASSETS } from '../../utils/visualAssets';

interface EditorialBannersProps {
  onNavigate: (route: string) => void;
}

export const EditorialBanners: React.FC<EditorialBannersProps> = ({ onNavigate }) => {
  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Curated Collections</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-black tracking-tight">
            Discover What's Trending & Handpicked
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-xl">
            Handpicked collections from the live catalogue — biggest discounts vs MRP, desk setups, everyday essentials and what's most clicked right now.
          </p>
        </div>
      </div>

      {/* 4-Card Bento Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Banner 1: Top Deals. Bigger Savings. */}
        <div
          onClick={() => onNavigate(EDITORIAL_ASSETS.topDeals.targetRoute)}
          className="group relative rounded-none overflow-hidden border border-slate-200 hover:border-black bg-white transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[260px] sm:min-h-[340px]"
        >
          {/* Background Image with Dark Vignette Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={EDITORIAL_ASSETS.topDeals.image}
              alt={EDITORIAL_ASSETS.topDeals.title}
              className="w-full h-full object-cover object-center opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-[#080D1A]/80 to-transparent"></div>
          </div>

          {/* Card Content */}
          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-black/55 text-white border border-white/40 backdrop-blur-md">
                <Flame className="w-3 h-3 text-white" />
                {EDITORIAL_ASSETS.topDeals.tagline}
              </span>
            </div>

            <div className="mt-12 sm:mt-20">
              <h3 className="text-xl font-extrabold uppercase text-white leading-snug">
                {EDITORIAL_ASSETS.topDeals.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {EDITORIAL_ASSETS.topDeals.description}
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors">
                <span>{EDITORIAL_ASSETS.topDeals.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Banner 2: Smart Picks For Your Setup */}
        <div
          onClick={() => onNavigate(EDITORIAL_ASSETS.setup.targetRoute)}
          className="group relative rounded-none overflow-hidden border border-slate-200 hover:border-black bg-white transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[260px] sm:min-h-[340px]"
        >
          <div className="absolute inset-0 z-0">
            <img
              src={EDITORIAL_ASSETS.setup.image}
              alt={EDITORIAL_ASSETS.setup.title}
              className="w-full h-full object-cover object-center opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-[#080D1A]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-black/55 text-white border border-white/40 backdrop-blur-md">
                <Laptop className="w-3 h-3 text-white" />
                {EDITORIAL_ASSETS.setup.tagline}
              </span>
            </div>

            <div className="mt-12 sm:mt-20">
              <h3 className="text-xl font-extrabold uppercase text-white leading-snug">
                {EDITORIAL_ASSETS.setup.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {EDITORIAL_ASSETS.setup.description}
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors">
                <span>{EDITORIAL_ASSETS.setup.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Banner 3: Upgrade Your Everyday */}
        <div
          onClick={() => onNavigate(EDITORIAL_ASSETS.everyday.targetRoute)}
          className="group relative rounded-none overflow-hidden border border-slate-200 hover:border-black bg-white transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[260px] sm:min-h-[340px]"
        >
          <div className="absolute inset-0 z-0">
            <img
              src={EDITORIAL_ASSETS.everyday.image}
              alt={EDITORIAL_ASSETS.everyday.title}
              className="w-full h-full object-cover object-center opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-[#080D1A]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-black/55 text-white border border-white/40 backdrop-blur-md">
                <Home className="w-3 h-3 text-white" />
                {EDITORIAL_ASSETS.everyday.tagline}
              </span>
            </div>

            <div className="mt-12 sm:mt-20">
              <h3 className="text-xl font-extrabold uppercase text-white leading-snug">
                {EDITORIAL_ASSETS.everyday.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {EDITORIAL_ASSETS.everyday.description}
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors">
                <span>{EDITORIAL_ASSETS.everyday.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Banner 4: Discover What's Trending */}
        <div
          onClick={() => onNavigate(EDITORIAL_ASSETS.trending.targetRoute)}
          className="group relative rounded-none overflow-hidden border border-slate-200 hover:border-black bg-white transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[260px] sm:min-h-[340px]"
        >
          <div className="absolute inset-0 z-0">
            <img
              src={EDITORIAL_ASSETS.trending.image}
              alt={EDITORIAL_ASSETS.trending.title}
              className="w-full h-full object-cover object-center opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-[#080D1A]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-black/55 text-white border border-white/40 backdrop-blur-md">
                <Star className="w-3 h-3 text-white" />
                {EDITORIAL_ASSETS.trending.tagline}
              </span>
            </div>

            <div className="mt-12 sm:mt-20">
              <h3 className="text-xl font-extrabold uppercase text-white leading-snug">
                {EDITORIAL_ASSETS.trending.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {EDITORIAL_ASSETS.trending.description}
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors">
                <span>{EDITORIAL_ASSETS.trending.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
