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
  // Counts are quoted only after the first live Firestore snapshot — before
  // that the list can be a stale cache and the header would show wrong
  // numbers for a beat.
  const liveSynced = store.hasLiveProducts();
  // Real taxonomy: derived from the products that actually exist, so every
  // pill opens a category with products in it — no empty dead ends.
  const derived = deriveCategories(products);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const shown = derived.slice(0, 11);

  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="flex items-end justify-between mb-3 px-1">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Shop by category
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-black tracking-tight">
              {liveSynced
                ? `${derived.length} categories · ${products.length} products`
                : 'Loading the live catalogue…'}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/categories')}
            className="text-xs sm:text-sm font-semibold text-black hover:text-slate-700 flex items-center gap-1.5 transition-colors group shrink-0 py-1"
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
                  className={`group flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 py-3.5 px-2 rounded-none border transition-all duration-200 card-lift ${
                    isActive
                      ? 'bg-black border-black text-white'
                      : 'bg-white border-slate-200 hover:border-black text-black hover:text-black'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? 'bg-white text-black'
                        : 'bg-black text-white group-hover:text-white border border-black'
                    }`}
                  >
                    <CategoryIcon categoryKey={cat.key} className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight text-center truncate max-w-full">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium mt-0.5">
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </span>
                </button>
              );
            })}
            {/* More tile */}
            <button
              onClick={() => onNavigate('/categories')}
              className="group flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 py-3.5 px-2 rounded-none border border-dashed border-slate-300 hover:border-black bg-transparent text-black hover:text-black transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-black text-white border border-black transition-transform duration-200 group-hover:scale-110">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold tracking-tight text-center">More</span>
              <span className="text-[10px] text-slate-600 font-medium mt-0.5">
                all categories
              </span>
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
