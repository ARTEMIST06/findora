import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Scale,
  Heart,
  User,
  LayoutDashboard,
  Menu,
  X,
  Flame,
  Grid,
  ChevronRight,
  Shield,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useFindoraStore } from '../../services/store';
import { formatINR } from '../../utils/formatters';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const store = useFindoraStore();
  const currentUser = store.getCurrentUser();
  const compareList = store.getCompareList();
  const wishlist = store.getWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search filter
  const allProducts = store.getAllProductsWithPrices(true);
  const searchSuggestions = searchQuery.trim()
    ? allProducts
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
          );
        })
        .slice(0, 5)
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onNavigate(`/product/${slug}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Top Utility Bar with Quick Persona Switcher & Compare Bar */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Real-time multi-store price engine
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-300">
              Comparing Amazon, Flipkart, Croma, Reliance Digital & more
            </span>
          </div>

          {/* Quick Role switcher for testing Admin / Editor / Shopper */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400 hidden md:inline">Mode:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/60">
              <button
                onClick={() => store.switchRole('admin')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  currentUser?.role === 'admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Switch to Admin role with full store & price control"
              >
                Admin
              </button>
              <button
                onClick={() => store.switchRole('editor')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  currentUser?.role === 'editor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Switch to Editor role"
              >
                Editor
              </button>
              <button
                onClick={() => store.switchRole('user')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  currentUser?.role === 'user'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Switch to Shopper (Public) role"
              >
                Shopper
              </button>
            </div>

            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button
                onClick={() => onNavigate('/admin')}
                className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Logo
            size="md"
            showTagline={false}
            onClick={() => onNavigate('/')}
            className="hover:opacity-95"
          />

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-700">
            <button
              onClick={() => onNavigate('/products')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-blue-600 hover:bg-slate-50 ${
                currentRoute === '/products' ? 'text-blue-600 bg-blue-50/60 font-semibold' : ''
              }`}
            >
              Explore Products
            </button>
            <button
              onClick={() => onNavigate('/categories')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-blue-600 hover:bg-slate-50 ${
                currentRoute.startsWith('/categories') ? 'text-blue-600 bg-blue-50/60 font-semibold' : ''
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => onNavigate('/deals')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-amber-600 hover:bg-amber-50/50 flex items-center gap-1.5 ${
                currentRoute === '/deals' ? 'text-amber-600 bg-amber-50 font-semibold' : ''
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Best Deals</span>
            </button>
          </nav>
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div ref={searchRef} className="relative flex-1 max-w-xl mx-2 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search products, brands (e.g. iPhone 16, Sony, M3)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Search Dropdown */}
          {isSearchOpen && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="p-2 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">
                Matching Products
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {searchSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod.slug)}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 border border-slate-100"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {prod.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{prod.brand}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">
                            {formatINR(prod.lowestPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
              <div
                onClick={handleSearchSubmit}
                className="p-2.5 bg-slate-50 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer border-t border-slate-100"
              >
                View all results for "{searchQuery}"
              </div>
            </div>
          )}
        </div>

        {/* Right Actions: Compare, Wishlist, User Profile, Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Compare Button with Pill Counter */}
          <button
            onClick={() => onNavigate('/compare')}
            className={`relative p-2.5 sm:px-3 sm:py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
              currentRoute === '/compare'
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:text-blue-600'
            }`}
            title="Compare products side-by-side"
          >
            <Scale className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline text-xs">Compare</span>
            {compareList.length > 0 && (
              <span className="bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                {compareList.length}
              </span>
            )}
          </button>

          {/* Wishlist Button with Pill Counter */}
          <button
            onClick={() => onNavigate('/wishlist')}
            className={`relative p-2.5 sm:px-3 sm:py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
              currentRoute === '/wishlist'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:text-rose-600'
            }`}
            title="Saved Wishlist"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span className="hidden md:inline text-xs">Saved</span>
            {wishlist.length > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* User Menu / Profile */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-none">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {isUserMenuOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                    Role: {currentUser.role}
                  </span>
                </div>

                {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('/admin');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Profile & History</span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    store.logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-200 outline-none"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </form>

          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/products');
              }}
              className="px-3 py-2 rounded-lg text-left hover:bg-slate-100"
            >
              Explore Products
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/categories');
              }}
              className="px-3 py-2 rounded-lg text-left hover:bg-slate-100"
            >
              Categories
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/deals');
              }}
              className="px-3 py-2 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 text-amber-600 font-semibold"
            >
              <Flame className="w-4 h-4" />
              <span>Best Deals</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/compare');
              }}
              className="px-3 py-2 rounded-lg text-left hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Compare Products</span>
              {compareList.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {compareList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/wishlist');
              }}
              className="px-3 py-2 rounded-lg text-left hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Saved Wishlist</span>
              {wishlist.length > 0 && (
                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/admin');
                }}
                className="px-3 py-2 rounded-lg text-left bg-blue-50 text-blue-700 font-semibold flex items-center gap-2 mt-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Admin Panel</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
