import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useFindoraStore } from '../../services/store';
import { deriveCategories } from '../../utils/categories';
import { CATEGORY_ASSETS } from '../../utils/visualAssets';
import { CategoryIcon } from '../common/CategoryIcon';
import { Reveal } from '../common/Reveal';

interface CategoryShowcaseProps {
  onNavigate: (route: string) => void;
}

/**
 * Large category showcase — the e-commerce style "shop by big category"
 * blocks. The top 6 categories by live product count get a large photo
 * tile (real category photo from CATEGORY_ASSETS, gradient + icon fallback
 * when a category has no photo). First tile is featured (spans 2 columns
 * on desktop). Counts come from the live catalogue, so every tile opens a
 * category that actually has products.
 */
export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  const liveSynced = store.hasLiveProducts();
  const derived = useMemo(() => deriveCategories(products), [products]);
  const shown = derived.slice(0, 6);

  if (!liveSynced || shown.length === 0) return null;

  return (
    <section className="py-5 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="flex items-end justify-between mb-4 px-1">
          <div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Big categories, best picks
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Shop the big categories
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              The categories with the most verified Amazon India picks — tap one to explore.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/categories')}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group shrink-0 py-1"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {shown.map((cat, i) => {
          const asset = CATEGORY_ASSETS[cat.slug] || CATEGORY_ASSETS[cat.key];
          const featured = i === 0;
          return (
            <Reveal
              key={cat.key}
              delay={Math.min(i, 5) * 70}
              className={featured ? 'col-span-2 lg:col-span-2' : ''}
            >
              <button
                onClick={() => onNavigate(`/category/${cat.slug}`)}
                className="group relative w-full h-44 sm:h-60 lg:h-64 rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all duration-300 card-lift focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              >
                {asset?.image ? (
                  <img
                    src={asset.image}
                    alt={asset.alt || cat.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center"
                  >
                    <CategoryIcon categoryKey={cat.key} className="w-20 h-20 text-white/30" />
                  </div>
                )}
                {/* Readability gradient — dark at the bottom where the text sits */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white/90 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5 mb-2">
                    {cat.count} {cat.count === 1 ? 'product' : 'products'}
                  </span>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white leading-tight">
                    {cat.name}
                  </h3>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                    Explore {cat.name}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};
