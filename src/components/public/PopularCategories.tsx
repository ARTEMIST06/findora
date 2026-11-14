import React, { useState } from 'react';
import { MoreHorizontal, ArrowRight } from 'lucide-react';
import { useFindoraStore } from '../../services/store';
import { deriveCategories } from '../../utils/categories';
import { Reveal } from '../common/Reveal';
import { CategoryIcon } from '../common/CategoryIcon';

interface PopularCategoriesProps {
  onNavigate: (route: string) => void;
}

export const PopularCategories: React.FC<PopularCategoriesProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  // Real taxonomy: derived from the products that actually exist, so every
  // pill opens a category with products in it — no empty dead ends.
  const derived = deriveCategories(products);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const shown = derived.slice(0, 11);

  return (
    <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="flex items-end justify-between mb-3 px-1">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Shop by category
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {derived.length} categories · {products.length} products
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/categories')}
            className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors group shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
        <div className="relative">
          <div className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto overscroll-x-contain touch-pan-x pb-3 pt-1 scrollbar-none no-scrollbar">
            {shown.map((cat) => {
              const isActive = activeSlug === cat.slug;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveSlug(cat.slug);
                    onNavigate(`/category/${cat.slug}`);
                  }}
                  className={`group flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 py-3.5 px-2 rounded-2xl border transition-all duration-200 card-lift ${
                    isActive
                      ? 'bg-blue-600/15 border-blue-500/60 shadow-lg shadow-blue-500/20 text-white'
                      : 'bg-[#0D1322]/80 border-slate-800/80 hover:bg-[#131E35] hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                        : 'bg-[#10172A] text-slate-400 group-hover:text-blue-400 border border-slate-800'
                    }`}
                  >
                    <CategoryIcon categoryKey={cat.key} className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight text-center truncate max-w-full">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </span>
                </button>
              );
            })}
            {/* More tile */}
            <button
              onClick={() => onNavigate('/categories')}
              className="group flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 py-3.5 px-2 rounded-2xl border border-dashed border-slate-700 hover:border-blue-500/50 bg-transparent text-slate-400 hover:text-white transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-[#10172A] border border-slate-800 group-hover:text-blue-400 transition-transform duration-200 group-hover:scale-110">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold tracking-tight text-center">More</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                all categories
              </span>
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
