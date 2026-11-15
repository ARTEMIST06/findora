import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useFindoraStore } from '../../services/store';
import { deriveCategories, productMatchesCategory } from '../../utils/categories';
import { Reveal } from '../common/Reveal';

interface CategoryShowcaseProps {
  onNavigate: (route: string) => void;
}

/**
 * Shop-by-category cards, Amazon-style: a clean white card per category
 * with the category name + live count on top, a 2x2 grid of REAL product
 * photos from that category in the middle, and a "See more" link at the
 * bottom. Trendieez-style spacing — one clear heading, wide gutters, no
 * badges, no clutter. Movement comes from the scroll reveal (staggered)
 * plus a hover zoom on the product photos and a card lift.
 *
 * Only the top 6 categories by live product count are shown; "View all"
 * opens the full categories page. Products without an image are skipped
 * when picking the 4 thumbnails.
 */
export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  const liveSynced = store.hasLiveProducts();
  const derived = useMemo(() => deriveCategories(products), [products]);
  const shown = derived.slice(0, 6);

  if (!liveSynced || shown.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="flex items-end justify-between mb-6 sm:mb-8 px-1">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Shop by category
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-black tracking-tight">
              Shop the big categories
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              The categories with the most verified Amazon India picks — real products inside every card.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/categories')}
            className="text-xs sm:text-sm font-semibold text-black hover:text-slate-700 flex items-center gap-1.5 transition-colors group shrink-0 py-1"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {shown.map((cat, i) => {
          const thumbs = products
            .filter((p) => productMatchesCategory(p.category, cat.key) && p.images && p.images.length > 0 && p.images[0])
            .slice(0, 4);
          return (
            <Reveal key={cat.key} delay={Math.min(i, 5) * 70}>
              <button
                onClick={() => onNavigate(`/category/${cat.slug}`)}
                className="group w-full bg-white border border-black/10 rounded-none text-left p-4 sm:p-5 transition-all duration-300 card-lift focus:outline-none focus:ring-4 focus:ring-black/20"
              >
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h3 className="text-lg sm:text-xl font-extrabold uppercase text-black leading-tight">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    {cat.count} {cat.count === 1 ? 'product' : 'products'}
                  </span>
                </div>

                {thumbs.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {thumbs.map((p) => (
                      <span
                        key={p.id}
                        className="block aspect-square bg-slate-100 overflow-hidden"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </span>
                    ))}
                  </div>
                )}

                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-black group-hover:text-slate-700 transition-colors">
                  See more
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};
