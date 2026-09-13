import React, { useState, useMemo } from 'react';
import {
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Search,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { useFindoraStore } from '../../services/store';

interface ProductsPageProps {
  onNavigate: (route: string) => void;
  initialCategory?: string;
  initialQuery?: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onNavigate,
  initialCategory,
  initialQuery = '',
}) => {
  const store = useFindoraStore();
  const allProducts = store.getAllProductsWithPrices(true);
  const categories = store.getCategories();
  const stores = store.getStores();

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract all unique brands
  const allBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    allProducts.forEach((p) => brandsSet.add(p.brand));
    return Array.from(brandsSet).sort();
  }, [allProducts]);

  // Handle brand toggle
  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrands([]);
    setSelectedStore('all');
    setMaxPrice(300000);
    setMinRating(0);
    setSortBy('relevance');
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            product.name.toLowerCase().includes(q) ||
            product.brand.toLowerCase().includes(q) ||
            product.category.toLowerCase().includes(q) ||
            product.tags.some((t) => t.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        // Brand filter
        if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
          return false;
        }

        // Store filter
        if (selectedStore !== 'all') {
          const hasStore = product.offers.some((o) => o.storeId === selectedStore);
          if (!hasStore) return false;
        }

        // Price filter
        if (product.lowestPrice && product.lowestPrice > maxPrice) {
          return false;
        }

        // Rating filter
        if (minRating > 0 && (!product.rating || product.rating < minRating)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return (a.lowestPrice || 0) - (b.lowestPrice || 0);
        }
        if (sortBy === 'price_desc') {
          return (b.lowestPrice || 0) - (a.lowestPrice || 0);
        }
        if (sortBy === 'discount') {
          return (b.maxDiscountPercent || 0) - (a.maxDiscountPercent || 0);
        }
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0; // relevance / default
      });
  }, [
    allProducts,
    searchQuery,
    selectedCategory,
    selectedBrands,
    selectedStore,
    maxPrice,
    minRating,
    sortBy,
  ]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    selectedBrands.length +
    (selectedStore !== 'all' ? 1 : 0) +
    (maxPrice < 300000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header with Title & Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore & Compare Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Showing <strong className="text-slate-900">{filteredProducts.length}</strong> verified products across all stores
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="relevance">Featured & Relevant</option>
                <option value="price_asc">Lowest Price First</option>
                <option value="price_desc">Highest Price First</option>
                <option value="discount">Biggest Discount (%)</option>
                <option value="rating">Highest Customer Rating</option>
                <option value="newest">Newly Listed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Search Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Category
            </label>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All Categories</span>
                <span>{allProducts.length}</span>
              </button>
              {categories.map((c) => {
                const count = allProducts.filter((p) => p.category === c.slug).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === c.slug
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Brand
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {allBrands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Store Filter */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Store Availability
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-medium text-slate-800"
            >
              <option value="all">Any Store (Amazon, Flipkart, etc.)</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  Available on {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Range Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider">Max Price</span>
              <span className="font-bold text-blue-600">
                {maxPrice >= 300000 ? 'Any Price' : `₹${maxPrice.toLocaleString('en-IN')}`}
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={300000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹10,000</span>
              <span>₹3,00,000+</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Minimum Rating
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[0, 4.0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`py-1 text-xs rounded-md border font-medium transition-colors ${
                    minRating === r
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r === 0 ? 'All' : `${r}★+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Cards Grid & Empty State */}
        <div className="lg:col-span-3">
          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-xs text-slate-500 font-medium">Active:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  {b}
                  <button onClick={() => toggleBrand(b)}>
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              ))}
              {selectedStore !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                  Store: {stores.find((s) => s.id === selectedStore)?.name}
                  <button onClick={() => setSelectedStore('all')}>
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              {maxPrice < 300000 && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                  Under ₹{maxPrice.toLocaleString('en-IN')}
                  <button onClick={() => setMaxPrice(300000)}>
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
              >
                Reset
              </button>
            </div>
          )}

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No products match your filters</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Try widening your price range, clearing brand selections, or removing specific store constraints.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
