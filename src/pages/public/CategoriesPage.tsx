import React from 'react';
import {
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Tv,
  Tablet,
  Gamepad2,
  Camera,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';

interface CategoriesPageProps {
  onNavigate: (route: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-7 h-7" />,
  Laptop: <Laptop className="w-7 h-7" />,
  Headphones: <Headphones className="w-7 h-7" />,
  Watch: <Watch className="w-7 h-7" />,
  Tv: <Tv className="w-7 h-7" />,
  Tablet: <Tablet className="w-7 h-7" />,
  Gamepad2: <Gamepad2 className="w-7 h-7" />,
  Camera: <Camera className="w-7 h-7" />,
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const categories = store.getCategories();
  const products = store.getAllProductsWithPrices(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <SEOHead 
        title="Product Categories - Findora"
        description="Browse our comprehensive taxonomy of premium electronics, including smartphones, laptops, audio gear, and more. Find and compare the best products in each category."
      />
      <div className="pb-6 border-b border-slate-800/80">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Product Taxonomy</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Browse All Product Categories
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore smart devices, electronics, and gadgets across verified Indian consumer stores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category === cat.slug);
          return (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/category/${cat.slug}`)}
              className="p-6 bg-[#0D1322]/80 hover:bg-[#0F172A] rounded-3xl border border-slate-800/80 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between group backdrop-blur-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all flex items-center justify-center shadow-sm">
                    {iconMap[cat.icon] || <Smartphone className="w-7 h-7" />}
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full">
                    {catProducts.length} items
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-normal">
                  {cat.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Featured Brands
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.popularBrands.map((b) => (
                      <span
                        key={b}
                        className="text-xs bg-[#070B14] border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                <span>Explore {cat.name}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
