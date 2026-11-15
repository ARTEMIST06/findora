/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './components/common/Toast';
import { Analytics } from './components/common/Analytics';

// Route-level code splitting: the production bundle was ~2.6MB with every
// page (including the heavy admin dashboards) loaded up front. Each route
// now loads its own chunk on demand; the shell (Navbar/Footer) stays eager.
const HomePage = lazy(() => import('./pages/public/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('./pages/public/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ComparePage = lazy(() => import('./pages/public/ComparePage').then((m) => ({ default: m.ComparePage })));
const WishlistPage = lazy(() => import('./pages/public/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CategoriesPage = lazy(() => import('./pages/public/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const DealsPage = lazy(() => import('./pages/public/DealsPage').then((m) => ({ default: m.DealsPage })));
const BlogPage = lazy(() => import('./pages/public/BlogPage').then((m) => ({ default: m.BlogPage })));
const ProfilePage = lazy(() => import('./pages/public/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AuthPage = lazy(() => import('./pages/public/AuthPages').then((m) => ({ default: m.AuthPage })));
const LegalPage = lazy(() => import('./pages/public/LegalPages').then((m) => ({ default: m.LegalPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })));
const DataCenter = lazy(() => import('./pages/admin/DataCenter').then((m) => ({ default: m.DataCenter })));
import { analytics } from './services/analytics';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // Check if hash exists first (e.g. #/deals), or pathname
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash;
    return window.location.pathname || '/';
  });

  // Track page views on route change
  useEffect(() => {
    const [pathPart] = currentPath.split('?');
    analytics.trackPageView(pathPart || '/');
  }, [currentPath]);

  // Keep state synced with browser history
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        setCurrentPath(hash);
      } else {
        setCurrentPath(window.location.pathname || '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation handler
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    // Update hash for smooth client-side iframe compatibility
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route parser
  const renderContent = () => {
    const [pathPart, queryPart] = currentPath.split('?');
    const searchParams = new URLSearchParams(queryPart || '');

    // 1. Home
    if (!pathPart || pathPart === '/' || pathPart === '') {
      return <HomePage onNavigate={handleNavigate} />;
    }

    // 2. Product Detail: /product/:slug
    if (pathPart.startsWith('/product/')) {
      const slug = pathPart.replace('/product/', '');
      return <ProductDetailPage slug={slug} onNavigate={handleNavigate} />;
    }

    // 3. Category Detail: /category/:slug
    if (pathPart.startsWith('/category/')) {
      const slug = pathPart.replace('/category/', '');
      return (
        <ProductsPage
          key={`cat-${slug}`}
          initialCategory={slug}
          onNavigate={handleNavigate}
        />
      );
    }

    // 4. Products List
    if (pathPart === '/products') {
      return <ProductsPage onNavigate={handleNavigate} />;
    }

    // 5. Search
    if (pathPart === '/search') {
      const query = searchParams.get('q') || '';
      return (
        <ProductsPage
          key={`search-${query}`}
          initialQuery={query}
          onNavigate={handleNavigate}
        />
      );
    }

    // 6. Categories Taxonomy
    if (pathPart === '/categories') {
      return <CategoriesPage onNavigate={handleNavigate} />;
    }

    // 7. Deals & Price Drops
    if (pathPart === '/deals') {
      return <DealsPage onNavigate={handleNavigate} />;
    }

    // 8. Product Comparison
    if (pathPart === '/compare') {
      return <ComparePage onNavigate={handleNavigate} />;
    }

    // 9. Personal Wishlist
    if (pathPart === '/wishlist') {
      return <WishlistPage onNavigate={handleNavigate} />;
    }

    // 10. Profile & Role Switcher
    if (pathPart === '/profile') {
      return <ProfilePage onNavigate={handleNavigate} />;
    }

    // 11. Auth Pages
    if (pathPart === '/login') {
      return <AuthPage mode="login" onNavigate={handleNavigate} />;
    }
    if (pathPart === '/signup') {
      return <AuthPage mode="signup" onNavigate={handleNavigate} />;
    }

    // 12. Admin Analytics & Audit
    if (pathPart === '/admin/analytics') {
      return <AnalyticsDashboard onNavigate={handleNavigate} />;
    }

    // 12b. Admin Data Center — one hub for health, access, tracker & inventory
    if (pathPart === '/admin/data-center') {
      return <DataCenter onNavigate={handleNavigate} />;
    }

    // 13. Admin Dashboard
    if (pathPart === '/admin') {
      return <AdminDashboard onNavigate={handleNavigate} />;
    }

    // 13. Legal & Info Pages
    if (pathPart === '/about') {
      return <LegalPage page="about" onNavigate={handleNavigate} />;
    }
    if (pathPart === '/contact') {
      return <LegalPage page="contact" onNavigate={handleNavigate} />;
    }
    if (pathPart === '/privacy') {
      return <LegalPage page="privacy" onNavigate={handleNavigate} />;
    }
    if (pathPart === '/terms') {
      return <LegalPage page="terms" onNavigate={handleNavigate} />;
    }
    if (pathPart === '/affiliate-disclosure') {
      return <LegalPage page="affiliate-disclosure" onNavigate={handleNavigate} />;
    }
    if (pathPart === '/cookie-disclosure') {
      return <LegalPage page="cookie-disclosure" onNavigate={handleNavigate} />;
    }

    // 14. Blog / Buying Guides (fix: Navbar + Footer linked here but no
    // route existed, so /blog fell through to the 404 page)
    if (pathPart === '/blog') {
      return <BlogPage onNavigate={handleNavigate} />;
    }

    // Fallback: 404
    return (
      <div className="max-w-lg mx-auto py-28 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-black/5 border border-black/20 flex items-center justify-center text-black">
          <span className="text-2xl font-bold">404</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Page Not Found</h2>
        <p className="text-sm text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">
          The link or product you followed doesn't match an active page on Findora. Explore our live catalog or search on Amazon India.
        </p>
        <button
          onClick={() => handleNavigate('/')}
          className="px-6 py-3 bg-black hover:bg-slate-800 text-white font-semibold text-sm rounded-none transition-all"
        >
          Return to Findora Home
        </button>
      </div>
    );
  };

  return (
    <HelmetProvider>
      <ToastProvider>
        <Analytics />
        <div className="min-h-screen flex flex-col bg-white font-sans text-black antialiased selection:bg-black selection:text-white">
          {/* Global Navigation Bar */}
          <Navbar currentRoute={currentPath} onNavigate={handleNavigate} />

          {/* Main Content Area */}
          <main className="flex-1 pb-6">
            <Suspense
              fallback={
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full border-2 border-slate-300 border-t-black animate-spin" />
                  <p className="text-sm text-slate-600 mt-4">Loading page…</p>
                </div>
              }
            >
              {renderContent()}
            </Suspense>
          </main>

          {/* Global Footer */}
          <Footer onNavigate={handleNavigate} />
        </div>
      </ToastProvider>
    </HelmetProvider>
  );
}
