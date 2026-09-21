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
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useFindoraStore } from '../../services/store';
import { analytics } from '../../services/analytics';
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
    const clean = searchQuery.trim();
    if (clean) {
      setIsSearchOpen(false);
      analytics.trackSearch(clean, searchSuggestions.length);
      onNavigate(`/search?q=${encodeURIComponent(clean)}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onNavigate(`/product/${slug}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/90 backdrop-blur-xl border-b border-white/10 transition-colors">
      {/* Top Utility Announcement Bar */}
      <div className="bg-[#05080F] border-b border-white/5 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Real-time multi-store price engine
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400">
              Tracking Amazon, Flipkart, Croma, Reliance Digital & more
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button
                onClick={() => onNavigate('/admin')}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <Logo
            size="md"
            showTagline={true}
            onClick={() => onNavigate('/')}
            className="hover:opacity-95"
          />

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-300">
            <button
              onClick={() => onNavigate('/')}
              className={`px-3.5 py-2 rounded-full transition-all ${
                currentRoute === '/'
                  ? 'text-white bg-white/10 font-semibold shadow-inner'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('/categories')}
              className={`px-3.5 py-2 rounded-full transition-all ${
                currentRoute.startsWith('/categories')
                  ? 'text-white bg-white/10 font-semibold shadow-inner'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => onNavigate('/compare')}
              className={`px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                currentRoute === '/compare'
                  ? 'text-white bg-white/10 font-semibold shadow-inner'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Compare</span>
              {compareList.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => onNavigate('/deals')}
              className={`px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                currentRoute === '/deals'
                  ? 'text-amber-400 bg-amber-500/15 font-semibold'
                  : 'hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Deals</span>
            </button>
            <button
              onClick={() => onNavigate('/blog')}
              className={`px-3.5 py-2 rounded-full transition-all ${
                currentRoute === '/blog'
                  ? 'text-white bg-white/10 font-semibold shadow-inner'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Blog
            </button>
          </nav>
        </div>

        {/* Middle: Pill Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search products, brands, categories..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#0F172A]/90 hover:bg-[#131E35] focus:bg-[#131E35] text-white placeholder-slate-400 text-sm rounded-full border border-slate-700/60 focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/15 transition-all outline-none"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1322] rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden z-50 backdrop-blur-xl">
              <div className="p-2.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 flex items-center justify-between">
                <span>Matching Products</span>
                <span className="text-blue-400">{searchSuggestions.length} found</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                {searchSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod.slug)}
                    className="p-3 hover:bg-slate-800/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#070B14] p-1 border border-slate-800 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {prod.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{prod.brand}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            {formatINR(prod.lowestPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
              <div
                onClick={handleSearchSubmit}
                className="p-2.5 bg-slate-900/90 text-center text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer border-t border-slate-800"
              >
                View all results for "{searchQuery}" →
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Compare Button */}
          <button
            onClick={() => onNavigate('/compare')}
            className={`relative p-2.5 sm:px-3.5 sm:py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
              currentRoute === '/compare'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                : 'text-slate-300 border-slate-800 bg-[#0D1322]/80 hover:bg-slate-800/80 hover:text-white hover:border-slate-700'
            }`}
            title="Compare products side-by-side"
          >
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="hidden xl:inline text-xs">Compare</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                compareList.length > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {compareList.length}
            </span>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => onNavigate('/wishlist')}
            className={`relative p-2.5 sm:px-3.5 sm:py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
              currentRoute === '/wishlist'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                : 'text-slate-300 border-slate-800 bg-[#0D1322]/80 hover:bg-slate-800/80 hover:text-white hover:border-slate-700'
            }`}
            title="Saved Wishlist"
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <span className="hidden xl:inline text-xs">Wishlist</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                wishlist.length > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {wishlist.length}
            </span>
          </button>

          {/* User Sign In / Profile Menu */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-slate-700 bg-[#0D1322] hover:bg-slate-800 transition-all"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left pr-1">
                  <span className="text-xs font-semibold text-white leading-none">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {isUserMenuOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0D1322] rounded-2xl shadow-2xl border border-slate-700/80 py-2 z-50 backdrop-blur-xl animate-in fade-in">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-blue-300">
                    Role: {currentUser.role}
                  </span>
                </div>

                {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('/admin');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-400" />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('/admin/analytics');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Analytics & Audit</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile & Price Alerts</span>
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    store.logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#090E1B]/95 backdrop-blur-2xl px-4 py-5 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white placeholder-slate-400 text-sm rounded-full border border-slate-700 outline-none"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </form>

          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/');
              }}
              className="px-3.5 py-2.5 rounded-xl text-left hover:bg-white/5 flex items-center justify-between"
            >
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/products');
              }}
              className="px-3.5 py-2.5 rounded-xl text-left hover:bg-white/5"
            >
              All Products
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/categories');
              }}
              className="px-3.5 py-2.5 rounded-xl text-left hover:bg-white/5"
            >
              Categories
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/deals');
              }}
              className="px-3.5 py-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2 text-amber-400 font-semibold"
            >
              <Flame className="w-4 h-4" />
              <span>Trending Deals</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/compare');
              }}
              className="px-3.5 py-2.5 rounded-xl text-left hover:bg-white/5 flex items-center justify-between"
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
              className="px-3.5 py-2.5 rounded-xl text-left hover:bg-white/5 flex items-center justify-between"
            >
              <span>Wishlist</span>
              {wishlist.length > 0 && (
                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/blog');
              }}
              className="px-3.5 py-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Buying Guides & Blog</span>
            </button>

            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/admin');
                }}
                className="px-3.5 py-2.5 rounded-xl text-left bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold flex items-center gap-2 mt-2"
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
