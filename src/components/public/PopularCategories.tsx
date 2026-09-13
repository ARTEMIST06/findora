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
} from 'lucide-react';
import { useFindoraStore } from '../../services/store';

interface PopularCategoriesProps {
  onNavigate: (route: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-6 h-6" />,
  Laptop: <Laptop className="w-6 h-6" />,
  Headphones: <Headphones className="w-6 h-6" />,
  Watch: <Watch className="w-6 h-6" />,
  Tv: <Tv className="w-6 h-6" />,
  Tablet: <Tablet className="w-6 h-6" />,
  Gamepad2: <Gamepad2 className="w-6 h-6" />,
  Camera: <Camera className="w-6 h-6" />,
};

export const PopularCategories: React.FC<PopularCategoriesProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const categories = store.getCategories();
  const products = store.getAllProductsWithPrices(true);

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Browse By Category
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Popular Product Categories
          </h2>
        </div>
        <button
          onClick={() => onNavigate('/categories')}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
        >
          <span>View all categories</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const count = products.filter((p) => p.category === cat.slug).length;
          return (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/category/${cat.slug}`)}
              className="group p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  {iconMap[cat.icon] || <Smartphone className="w-6 h-6" />}
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                  {cat.popularBrands.slice(0, 3).join(', ')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
