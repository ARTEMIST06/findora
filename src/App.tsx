/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Real routes (react-router BrowserRouter, PR #34). Before this, the app used
// hash routing (/#/products, ...): every URL served the same index.html and
// crawlers only ever saw the homepage. The route table below is the exact
// same set the old manual if-chain rendered — nothing added, nothing
// dropped. The `onNavigate(path)` API every page/component already uses is
// kept as-is and is now implemented with react-router's navigate(), so no
// call site had to change. Legacy #/ links (published in video descriptions
// and bios) still work via HashRedirect, which rewrites them to real paths
// on first load.

import React, { useEffect, useCallback, Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
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
import { logPageView } from './services/realtime';

type NavigateFn = (path: string) => void;

/** /product/:slug — slug comes from the route param now, not a string split. */
function ProductDetailRoute({ onNavigate }: { onNavigate: NavigateFn }) {
  const { slug } = useParams();
  return <ProductDetailPage slug={slug ?? ''} onNavigate={onNavigate} />;
}

/** /category/:slug — key remounts ProductsPage per category (as before). */
function CategoryRoute({ onNavigate }: { onNavigate: NavigateFn }) {
  const { slug } = useParams();
  return (
    <ProductsPage
      key={`cat-${slug}`}
      initialCategory={slug}
      onNavigate={onNavigate}
    />
  );
}

/** /search?q=... — key remounts ProductsPage per query (as before). */
function SearchRoute({ onNavigate }: { onNavigate: NavigateFn }) {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  return (
    <ProductsPage
      key={`search-${query}`}
      initialQuery={query}
      onNavigate={onNavigate}
    />
  );
}

/** 404 page — unchanged copy from the old manual router. */
function NotFound({ onNavigate }: { onNavigate: NavigateFn }) {
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
        onClick={() => onNavigate('/')}
        className="px-6 py-3 bg-black hover:bg-slate-800 text-white font-semibold text-sm rounded-none transition-all"
      >
        Return to Findora Home
      </button>
    </div>
  );
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();

  // Legacy hash links (/#/products, /#/product/..., ...) published in video
  // descriptions and bios: rewrite to the real path once, on first load.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && hash.startsWith('/')) {
      navigate(hash, { replace: true });
    }
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track page views on route change (pathname only, as before).
  // GA4 keeps its own page_view; logPageView writes the same view to
  // Firestore `siteEvents` so the admin dashboard has view data of its
  // own (PR #43). Both are fire-and-forget.
  useEffect(() => {
    analytics.trackPageView(location.pathname || '/');
    logPageView(location.pathname || '/');
  }, [location.pathname]);

  // Scroll to top on every navigation (the old handler did this too).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  // The navigation API every page/component already uses.
  const handleNavigate = useCallback<NavigateFn>(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-black antialiased selection:bg-black selection:text-white">
      {/* Global Navigation Bar */}
      <Navbar currentRoute={location.pathname} onNavigate={handleNavigate} />

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
          <Routes>
            <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
            <Route path="/product/:slug" element={<ProductDetailRoute onNavigate={handleNavigate} />} />
            <Route path="/category/:slug" element={<CategoryRoute onNavigate={handleNavigate} />} />
            <Route path="/products" element={<ProductsPage onNavigate={handleNavigate} />} />
            <Route path="/search" element={<SearchRoute onNavigate={handleNavigate} />} />
            <Route path="/categories" element={<CategoriesPage onNavigate={handleNavigate} />} />
            <Route path="/deals" element={<DealsPage onNavigate={handleNavigate} />} />
            <Route path="/compare" element={<ComparePage onNavigate={handleNavigate} />} />
            <Route path="/wishlist" element={<WishlistPage onNavigate={handleNavigate} />} />
            <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} />} />
            <Route path="/login" element={<AuthPage mode="login" onNavigate={handleNavigate} />} />
            <Route path="/signup" element={<AuthPage mode="signup" onNavigate={handleNavigate} />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard onNavigate={handleNavigate} />} />
            <Route path="/admin/data-center" element={<DataCenter onNavigate={handleNavigate} />} />
            <Route path="/admin" element={<AdminDashboard onNavigate={handleNavigate} />} />
            <Route path="/about" element={<LegalPage page="about" onNavigate={handleNavigate} />} />
            <Route path="/contact" element={<LegalPage page="contact" onNavigate={handleNavigate} />} />
            <Route path="/faq" element={<LegalPage page="faq" onNavigate={handleNavigate} />} />
            <Route path="/privacy" element={<LegalPage page="privacy" onNavigate={handleNavigate} />} />
            <Route path="/terms" element={<LegalPage page="terms" onNavigate={handleNavigate} />} />
            <Route path="/affiliate-disclosure" element={<LegalPage page="affiliate-disclosure" onNavigate={handleNavigate} />} />
            <Route path="/cookie-disclosure" element={<LegalPage page="cookie-disclosure" onNavigate={handleNavigate} />} />
            <Route path="/blog" element={<BlogPage onNavigate={handleNavigate} />} />
            <Route path="*" element={<NotFound onNavigate={handleNavigate} />} />
          </Routes>
        </Suspense>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <Analytics />
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </ToastProvider>
    </HelmetProvider>
  );
}
