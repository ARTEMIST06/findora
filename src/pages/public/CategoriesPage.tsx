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
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';

interface CategoriesPageProps {
  onNavigate: (route: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-8 h-8" />,
  Laptop: <Laptop className="w-8 h-8" />,
  Headphones: <Headphones className="w-8 h-8" />,
  Watch: <Watch className="w-8 h-8" />,
  Tv: <Tv className="w-8 h-8" />,
  Tablet: <Tablet className="w-8 h-8" />,
  Gamepad2: <Gamepad2 className="w-8 h-8" />,
  Camera: <Camera className="w-8 h-8" />,
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const categories = store.getCategories();
  const products = store.getAllProductsWithPrices(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <SEOHead 
        title="Product Categories - Findora"
        description="Browse our comprehensive taxonomy of premium electronics, including smartphones, laptops, audio gear, and more. Find and compare the best products in each category."
      />
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Product Taxonomy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Browse All Product Categories
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
              className="p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
                    {iconMap[cat.icon] || <Smartphone className="w-8 h-8" />}
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {catProducts.length} items
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {cat.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Featured Brands:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.popularBrands.map((b) => (
                      <span
                        key={b}
                        className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
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
