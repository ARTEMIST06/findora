import React, { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useFindoraStore } from '../../services/store';

interface RecentlyAddedProps {
  onNavigate: (route: string) => void;
}

export const RecentlyAdded: React.FC<RecentlyAddedProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);
  
  // Exclude featured and deals to avoid too much duplication, 
  // or just show the newest regardless. Let's just show newest.
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 12); // Show up to 12 recent products

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Latest Finds</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Explore All Products
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Fresh arrivals and recently discovered items.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/products')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
        >
          <span>View all {products.length} items</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentProducts.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};
