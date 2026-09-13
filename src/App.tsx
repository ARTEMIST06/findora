/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './components/common/Toast';
import { Analytics } from './components/common/Analytics';

import { HomePage } from './pages/public/HomePage';
import { ProductsPage } from './pages/public/ProductsPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { ComparePage } from './pages/public/ComparePage';
import { WishlistPage } from './pages/public/WishlistPage';
import { CategoriesPage } from './pages/public/CategoriesPage';
import { DealsPage } from './pages/public/DealsPage';
import { ProfilePage } from './pages/public/ProfilePage';
import { AuthPage } from './pages/public/AuthPages';
import { LegalPage } from './pages/public/LegalPages';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // Check if hash exists first (e.g. #/deals), or pathname
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash;
    return window.location.pathname || '/';
  });

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

    // 12. Admin Dashboard
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

    // Fallback: 404
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The link you followed doesn't match an active page.
        </p>
        <button
          onClick={() => handleNavigate('/')}
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl"
        >
          Return to Home
        </button>
      </div>
    );
  };

  return (
    <HelmetProvider>
      <ToastProvider>
        <Analytics />
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
          {/* Global Navigation Bar */}
          <Navbar currentRoute={currentPath} onNavigate={handleNavigate} />

          {/* Main Content Area */}
          <main className="flex-1 pb-16">{renderContent()}</main>

          {/* Global Footer */}
          <Footer onNavigate={handleNavigate} />
        </div>
      </ToastProvider>
    </HelmetProvider>
  );
}
