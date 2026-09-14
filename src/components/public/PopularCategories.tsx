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
    <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            Browse By Category
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Popular Product Categories
          </h2>
        </div>
        <button
          onClick={() => onNavigate('/categories')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
        >
          <span>View all categories</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {categories.slice(0, 6).map((cat, index) => {
          const count = products.filter((p) => p.category === cat.slug).length;
          // Generate a subtle placeholder gradient per category
          const gradients = [
            'from-blue-50 to-sky-100',
            'from-purple-50 to-fuchsia-100',
            'from-emerald-50 to-teal-100',
            'from-rose-50 to-pink-100',
            'from-amber-50 to-orange-100',
            'from-indigo-50 to-blue-100',
            'from-cyan-50 to-sky-100',
            'from-slate-100 to-slate-200'
          ];
          const bgGradient = gradients[index % gradients.length];

          return (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/category/${cat.slug}`)}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between aspect-square bg-gradient-to-br ${bgGradient}`}
            >
              {/* Top part with icon and count */}
              <div className="p-4 flex items-start justify-between z-10">
                <div className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {iconMap[cat.icon] || <Smartphone className="w-5 h-5" />}
                </div>
              </div>

              {/* Bottom text */}
              <div className="p-4 z-10">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-600 font-medium mt-0.5">
                  {count} {count === 1 ? 'Product' : 'Products'}
                </p>
              </div>

              {/* Decorative background shape */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:bg-white/60 transition-colors z-0"></div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
