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
import { SEOHead } from '../../components/common/SEOHead';
import { ProductCard } from '../../components/common/ProductCard';
import { useFindoraStore } from '../../services/store';
import { analytics } from '../../services/analytics';
import {
  deriveCategories,
  productMatchesCategory,
  categoryNameForSlug,
} from '../../utils/categories';
import {
  matchesSearchQuery,
  searchRelevance,
  productSearchHaystack,
} from '../../utils/search';

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
  // Until the first live Firestore snapshot arrives, allProducts can be a
  // stale cache — and a category filter applied to that cache can yield 0
  // products, flashing a "No products match" empty state for ~10s on first
  // open. Gate the results on the sync flag instead.
  const liveSynced = store.hasLiveProducts();
  // Public taxonomy is derived from the live products (see utils/categories):
  // the Admin taxonomy slugs never matched the stored category strings,
  // which is why category pages used to come up empty.
  const categories = useMemo(() => deriveCategories(allProducts), [allProducts]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(300000);
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
    setMaxPrice(300000);
    setSortBy('relevance');
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Query filter — word-level matching (see utils/search): every word
        // of the query must appear in the name/brand/category/tags, so
        // "Solimo Planter" finds "Solimo Flower Planter ...".
        if (searchQuery.trim()) {
          if (!matchesSearchQuery(productSearchHaystack(product), searchQuery)) return false;
        }

        // Category filter (normalised: stored strings like "Home & Kitchen"
        // match the slug "home-kitchen").
        if (selectedCategory !== 'all' && !productMatchesCategory(product.category, selectedCategory)) {
          return false;
        }

        // Brand filter
        if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
          return false;
        }

        // Price filter
        if (product.lowestPrice && product.lowestPrice > maxPrice) {
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
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Default ('relevance'): with a search query, exact-phrase matches
        // first, then name-leading matches, then all-words matches.
        if (searchQuery.trim()) {
          const rel =
            searchRelevance(productSearchHaystack(b), searchQuery) -
            searchRelevance(productSearchHaystack(a), searchQuery);
          if (rel !== 0) return rel;
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [
    allProducts,
    searchQuery,
    selectedCategory,
    selectedBrands,
    maxPrice,
    sortBy,
  ]);

  // Picks shown when a search returns nothing — newest published products,
  // so the page never ends in a dead end.
  const popularPicks = useMemo(
    () =>
      [...allProducts]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 8),
    [allProducts]
  );

  // Track category view
  React.useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      analytics.trackViewCategory(selectedCategory, filteredProducts.length);
    }
  }, [selectedCategory, filteredProducts.length]);

  // Track search query with debounce
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const timer = setTimeout(() => {
      analytics.trackSearch(trimmed, filteredProducts.length);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filteredProducts.length]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    selectedBrands.length +
    (maxPrice < 300000 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const isSearchState = Boolean(initialQuery || (searchQuery && searchQuery.trim() !== ''));
  const isCategoryPage = Boolean(initialCategory && initialCategory !== 'all');
  const categoryName = isCategoryPage ? categoryNameForSlug(allProducts, initialCategory) : '';

  let seoTitle = 'Explore & Compare Products | Findora';
  let seoDescription = 'Browse verified Amazon India prices for earbuds, fashion, home & kitchen, appliances, watches and more — one checked offer per product.';
  let canonicalPath = '/products';
  let isNoIndex = false;
  let breadcrumbs: Array<{ name: string; url: string }> = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
  ];

  if (isSearchState) {
    const q = (initialQuery || searchQuery).trim();
    seoTitle = `Search Results for "${q}" | Findora`;
    seoDescription = `Compare prices and find the best deals for "${q}" on Amazon India with Findora.`;
    canonicalPath = '/products';
    isNoIndex = true;
    breadcrumbs.push({ name: `Search: ${q}`, url: `/search?q=${encodeURIComponent(q)}` });
  } else if (isCategoryPage) {
    seoTitle = `Best ${categoryName} Price Comparison & Deals | Findora`;
    seoDescription = `Browse verified Amazon India deals for ${categoryName.toLowerCase()} on Findora — one checked offer per product, with the price and last-verified date shown.`;
    canonicalPath = `/category/${initialCategory}`;
    isNoIndex = false;
    breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Categories', url: '/categories' },
      { name: categoryName, url: `/category/${initialCategory}` },
    ];
  }

  const pageTitle = initialQuery 
    ? `Search Results for "${initialQuery}"` 
    : isCategoryPage 
      ? categoryName 
      : 'Explore & Compare Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <SEOHead 
        title={seoTitle} 
        description={seoDescription}
        canonicalPath={canonicalPath}
        noIndex={isNoIndex}
        breadcrumbs={breadcrumbs}
      />
      
      {/* Header with Title & Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Product Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {liveSynced ? (
              <>Showing <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> verified products on Amazon India</>
            ) : (
              'Loading the live catalogue…'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden px-3.5 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 flex items-center gap-2 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-black text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 hidden sm:inline font-medium">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-300/80 rounded-full px-3.5 py-2 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-black cursor-pointer shadow-md"
              >
                <option value="relevance">Featured & Relevant</option>
                <option value="price_asc">Lowest Price First</option>
                <option value="price_desc">Highest Price First</option>
                <option value="discount">Biggest Discount (%)</option>
                <option value="newest">Newly Listed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white/80 border border-slate-200/80 rounded-none p-5 backdrop-blur-md h-fit sticky top-24 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Filter className="w-4 h-4 text-black" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-black/30 text-black border border-black/20 px-2 py-0.2 rounded-full text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-black hover:text-black font-semibold"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Search Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300/80 rounded-full text-slate-900 placeholder-slate-400 outline-none focus:border-black"
              />
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Category
            </label>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-black/10 text-black font-bold border border-black/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] text-slate-600">{allProducts.length}</span>
              </button>
              {categories.map((c) => {
                const count = c.count;
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between ${
                      selectedCategory === c.slug
                        ? 'bg-black/10 text-black font-bold border border-black/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-slate-600">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Brand
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
              {allBrands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="rounded bg-white border-slate-300 text-black focus:ring-black/20"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Max Price Range Slider */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Max Price</span>
              <span className="font-bold text-black">
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
              className="w-full accent-black"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>₹10,000</span>
              <span>₹3,00,000+</span>
            </div>
          </div>
        </aside>

        {/* Product Cards Grid & Empty State */}
        <div className="lg:col-span-3">
          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white rounded-none border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">Active:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-black/5 border border-black/20 text-black px-2.5 py-1 rounded-full">
                  Category: {categoryNameForSlug(allProducts, selectedCategory)}
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-3 h-3 text-black hover:text-slate-900" />
                  </button>
                </span>
              )}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 text-xs bg-black/5 border border-black/20 text-black px-2.5 py-1 rounded-full"
                >
                  {b}
                  <button onClick={() => toggleBrand(b)}>
                    <X className="w-3 h-3 text-black hover:text-slate-900" />
                  </button>
                </span>
              ))}
              {maxPrice < 300000 && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-black/5 border border-black/20 text-black px-2.5 py-1 rounded-full">
                  Under ₹{maxPrice.toLocaleString('en-IN')}
                  <button onClick={() => setMaxPrice(300000)}>
                    <X className="w-3 h-3 text-black hover:text-slate-900" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-xs text-black hover:text-black font-semibold ml-auto"
              >
                Reset All
              </button>
            </div>
          )}

          {/* Grid */}
          {!liveSynced ? (
            <div>
              <div className="text-center py-10 px-4">
                <p className="text-sm text-slate-600">Loading the live catalogue…</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-none border border-slate-200 bg-white h-80 animate-pulse" />
                ))}
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4 bg-white rounded-none border border-slate-200">
              <div className="w-16 h-16 rounded-none bg-slate-100/80 flex items-center justify-center mx-auto mb-4 text-slate-600 border border-slate-300">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No products match your filters</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
                {searchQuery.trim()
                  ? `Nothing matched "${searchQuery.trim()}". Try one of these instead, or clear your filters.`
                  : 'Try widening your price range or clearing brand selections.'}
              </p>
              {searchQuery.trim() && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  {['earbuds', 'power bank', 'smartwatch', 'kurta', 'air fryer'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSearchQuery(s)}
                      className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white font-semibold text-xs shadow-lg shadow-black/10"
              >
                Clear all filters
              </button>
              {searchQuery.trim() && popularPicks.length > 0 && (
                <div className="mt-12 text-left">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 text-center">Browse these instead</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {popularPicks.map((product) => (
                      <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
