import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
import { CATEGORY_ASSETS } from '../../utils/visualAssets';
import { deriveCategories, categoryAccent } from '../../utils/categories';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { Reveal } from '../../components/common/Reveal';

interface CategoriesPageProps {
  onNavigate: (route: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  // Counts are quoted only after the first live Firestore snapshot — before
  // that the list can be a stale cache.
  const liveSynced = store.hasLiveProducts();
  // Derived from the live catalogue — counts are real, and every tile opens
  // a category that actually has products. (The old page counted
  // `product.category === category.slug`, which missed almost everything
  // because stored category strings never matched the taxonomy slugs.)
  const categories = deriveCategories(products);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <SEOHead
        title="Product Categories | Findora"
        description="Browse every category on Findora — earbuds, power banks, fashion, home & kitchen, appliances, watches and more — with verified Amazon India prices."
        canonicalPath="/categories"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Categories', url: '/categories' },
        ]}
      />
      <Reveal>
        <div className="pb-6 border-b border-slate-200/80">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-widest mb-1.5">
            <Layers className="w-4 h-4 text-black" />
            <span>Product Categories</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Browse All Product Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {liveSynced
              ? `${categories.length} categories · ${products.length} verified products on Amazon India. Every count below is live.`
              : 'Loading the live catalogue…'}
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => {
          const asset = CATEGORY_ASSETS[cat.slug] || CATEGORY_ASSETS[cat.key];
          const accent = asset?.accent || categoryAccent(cat.key);
          return (
            <Reveal key={cat.key} delay={Math.min(i, 5) * 40}>
              <div
                onClick={() => onNavigate(`/category/${cat.slug}`)}
                className="relative p-6 bg-white/90 hover:bg-white rounded-none border border-slate-200/80 hover:border-black/40 hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 cursor-pointer flex flex-col justify-between group overflow-hidden card-lift h-full"
              >
                {asset?.image && (
                  <div className="absolute top-0 right-0 w-1/2 h-44 pointer-events-none opacity-60 group-hover:opacity-90 transition-opacity duration-300 overflow-hidden rounded-tr-3xl">
                    <img
                      src={asset.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0D1322]/80 to-[#0D1322]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1322] via-transparent to-transparent"></div>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-14 h-14 rounded-none bg-black/5 border border-black/10 text-black group-hover:bg-black group-hover:text-white transition-all flex items-center justify-center shadow-sm"
                      style={{ borderColor: `${accent}40` }}
                    >
                      <CategoryIcon categoryKey={cat.key} className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 bg-slate-800/90 border border-slate-700/60 px-3 py-1 rounded-full">
                      {cat.count} {cat.count === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-black transition-colors">
                    {cat.name}
                  </h3>
                  <p className={`text-xs text-slate-600 mt-2 leading-relaxed font-normal ${asset?.image ? 'max-w-[58%]' : ''}`}>
                    Verified Amazon India prices, checked by the Findora team.
                  </p>

                  {cat.brands.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        Featured Brands
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.brands.map((b) => (
                          <span
                            key={b}
                            className="text-xs bg-[#070B14] border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-black group-hover:text-black relative z-10">
                  <span>Explore {cat.name}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
};
