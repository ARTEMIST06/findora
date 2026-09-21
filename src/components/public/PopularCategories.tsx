import React, { useState } from 'react';
import {
  Monitor,
  Home,
  CookingPot,
  Shirt,
  Sparkles,
  Smartphone,
  Gamepad2,
  Dumbbell,
  Book,
  Plane,
  Car,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { useFindoraStore } from '../../services/store';

interface PopularCategoriesProps {
  onNavigate: (route: string) => void;
}

interface CategoryPill {
  id: string;
  name: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PopularCategories: React.FC<PopularCategoriesProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const [activeCategory, setActiveCategory] = useState<string>('electronics');

  const categoryPills: CategoryPill[] = [
    { id: 'cat-electronics', name: 'Electronics', slug: 'laptops', icon: Monitor },
    { id: 'cat-home', name: 'Home & Living', slug: 'home-appliances', icon: Home },
    { id: 'cat-kitchen', name: 'Kitchen', slug: 'kitchen', icon: CookingPot },
    { id: 'cat-fashion', name: 'Fashion', slug: 'fashion', icon: Shirt },
    { id: 'cat-beauty', name: 'Beauty', slug: 'beauty', icon: Sparkles },
    { id: 'cat-mobiles', name: 'Mobiles & Tablets', slug: 'smartphones', icon: Smartphone },
    { id: 'cat-gaming', name: 'Gaming', slug: 'gaming', icon: Gamepad2 },
    { id: 'cat-fitness', name: 'Health & Fitness', slug: 'smartwatches', icon: Dumbbell },
    { id: 'cat-books', name: 'Books', slug: 'books', icon: Book },
    { id: 'cat-travel', name: 'Travel', slug: 'travel', icon: Plane },
    { id: 'cat-auto', name: 'Auto', slug: 'auto', icon: Car },
    { id: 'cat-more', name: 'More', slug: 'all', icon: MoreHorizontal },
  ];

  const handleCategoryClick = (cat: CategoryPill) => {
    setActiveCategory(cat.id);
    if (cat.slug === 'all') {
      onNavigate('/categories');
    } else {
      onNavigate(`/category/${cat.slug}`);
    }
  };

  return (
    <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Category Icons Strip matching reference screenshot */}
      <div className="relative">
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar">
          {categoryPills.map((cat) => {
            const IconComp = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className={`group flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 py-3.5 px-2 rounded-2xl border transition-all duration-200 ${
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
                  <IconComp className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold tracking-tight text-center truncate max-w-full">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
