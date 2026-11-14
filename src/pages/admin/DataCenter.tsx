import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Database,
  Eye,
  MousePointerClick,
  RefreshCw,
  Search,
  ShieldCheck,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
import { analytics } from '../../services/analytics';
import type {
  AggregatedSearchQuery,
  ProductPerformanceMetric,
  UserMetricsRecord,
  VisitorFunnelMetric,
} from '../../services/analytics';
import { fetchAdminLoginHistory } from '../../services/audit';
import type { AdminLoginHistoryRecord } from '../../services/audit';
import { formatINR, formatRelativeTime } from '../../utils/formatters';
import { deriveCategories, productMatchesCategory } from '../../utils/categories';

interface DataCenterProps {
  onNavigate: (route: string) => void;
}

// Bootstrapped admin emails from src/services/store.ts — kept in sync here
// so the access panel can explain who can sign in as admin.
const BOOTSTRAPPED_ADMINS = [
  { email: 'findorame@gmail.com', note: 'Findora account — use this for affiliate/admin work' },
  { email: 'aryasingh2366@gmail.com', note: 'Personal Gmail — do NOT use for affiliate work' },
  { email: 'admin@findora.com', note: 'Seed admin (password login)' },
];

export const DataCenter: React.FC<DataCenterProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const currentUser = store.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isEditor = isAdmin || currentUser?.role === 'editor';

  const [apiHealth, setApiHealth] = useState<{ ok: boolean; ms: number; checkedAt: string; detail: string } | null>(null);
  const [apiChecking, setApiChecking] = useState(false);
  const [topSearches, setTopSearches] = useState<AggregatedSearchQuery[]>([]);
  const [zeroResultSearches, setZeroResultSearches] = useState<AggregatedSearchQuery[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginHistoryRecord[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetricsRecord | null>(null);
  const [draftDocs, setDraftDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const checkApiHealth = async () => {
    setApiChecking(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const ms = Math.round(performance.now() - start);
      const body = await res.json().catch(() => ({}));
      setApiHealth({
        ok: res.ok && body.status === 'ok',
        ms,
        checkedAt: new Date().toISOString(),
        detail: res.ok ? `HTTP ${res.status} · status: ${body.status || 'unknown'}` : `HTTP ${res.status}`,
      });
    } catch (err: any) {
      setApiHealth({
        ok: false,
        ms: Math.round(performance.now() - start),
        checkedAt: new Date().toISOString(),
        detail: err?.message || 'Request failed',
      });
    } finally {
      setApiChecking(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [searchesRes, loginsRes, usersRes, draftsRes] = await Promise.all([
        analytics.fetchSearchAnalytics(),
        fetchAdminLoginHistory(),
        analytics.fetchAuthenticatedUserMetrics(),
        store.getDrafts(),
      ]);
      setTopSearches(searchesRes.topSearches);
      setZeroResultSearches(searchesRes.zeroResultSearches);
      setLoginHistory(loginsRes);
      setUserMetrics(usersRes);
      setDraftDocs(draftsRes);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Data Center load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isEditor) {
      checkApiHealth();
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isEditor]);

  // --- Inventory (live from the store) ---
  // NOTE: these are computed fresh on EVERY render, deliberately NOT
  // useMemo'd on [store]. The store object is a referentially stable
  // singleton — useMemo([store]) never recomputed, so the Data Center kept
  // showing the first render's numbers (45 products from the stale cache)
  // while the public site showed the live 203. The component re-renders on
  // every store change (useSyncExternalStore), so plain derivation stays
  // fresh; the lists are small (hundreds of products), so this is cheap.
  const allProducts = store.getAllProductsWithPrices(false);
  const publishedProducts = allProducts.filter((p) => p.published !== false);
  const draftProducts = allProducts.filter((p) => p.published === false);
  const offers = store.getOffers();
  const clicks = store.getAffiliateClicks();
  const stores = store.getStores();
  const categories = store.getCategories();
  const users = store.getUsers();
  const derivedCats = deriveCategories(publishedProducts);
  // Brands live on the products themselves (the Firestore brands collection
  // is empty) — derive the unique set from the catalogue.
  const brandNames = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))].sort();

  // Affiliate tag audit — the money link check.
  const tagAudit = (() => {
    let onNewTag = 0;
    let onOtherLink = 0;
    let missing = 0;
    for (const o of offers) {
      const url = (o.affiliateUrl || '').trim();
      if (!url) missing += 1;
      else if (url.includes('tag=arya0611-21')) onNewTag += 1;
      else onOtherLink += 1;
    }
    return { onNewTag, onOtherLink, missing, total: offers.length };
  })();

  // --- Tracker ---
  const productMetrics: ProductPerformanceMetric[] = analytics.getProductPerformanceData(publishedProducts, clicks, []);
  const topByClicks = [...productMetrics].sort((a, b) => b.amazonClicks - a.amazonClicks).slice(0, 10);
  const topByViews = [...productMetrics].sort((a, b) => b.views - a.views).slice(0, 10);
  // Clicks per derived category (productId -> product -> normalized
  // category), NOT the Admin taxonomy — the taxonomy surfaces stored typos
  // like "Large Appiliances" as if they were categories.
  const clicksByCategory = derivedCats
    .map((c) => {
      const ids = new Set(
        publishedProducts.filter((p) => productMatchesCategory(p.category, c.key)).map((p) => p.id)
      );
      return {
        name: c.name,
        productCount: c.count,
        affiliateClicks: clicks.filter((cl) => ids.has(cl.productId)).length,
      };
    })
    .sort((a, b) => b.affiliateClicks - a.affiliateClicks);
  const funnel: VisitorFunnelMetric = (() => {
    // Same modelled estimate as AnalyticsDashboard: total visitors is an
    // estimate from registered users + clicks, NOT a measured count.
    const totalVisitorsEstimate = Math.max(
      (userMetrics?.totalUsers || 0) * 4,
      clicks.length > 0 ? clicks.length * 4 : 48
    );
    return analytics.getVisitorFunnel(totalVisitorsEstimate, publishedProducts.length, clicks.length);
  })();
  const recentClicks = [...clicks]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const gaConfigured = analytics.isGA4Configured();
  const gaId = analytics.getGA4MeasurementId();

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#0D1322] border border-slate-800 flex items-center justify-center mx-auto mb-5 shadow-xl">
          <ShieldCheck className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">Authentication Required</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">Sign in with an admin account to open the Data Center.</p>
        <button
          onClick={() => onNavigate('/login')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
        >
          Sign In to Account
        </button>
      </div>
    );
  }

  if (!isAdmin && !isEditor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-xl">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
          Your current account role is <strong className="text-white">{currentUser?.role || 'Shopper'}</strong>. The Data Center requires Administrator or Editor permissions.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 rounded-full border border-slate-700 bg-[#0D1322] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="admin-container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 min-h-screen text-slate-100">
      <SEOHead title="Data Center | Findora Admin" description="Findora Data Center — site health, login & access, tracker and data inventory." canonicalPath="/admin/data-center" noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Findora Internal Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Data Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Health, login &amp; access, tracker and inventory — everything about the site in one place. Signed in as{' '}
            <strong className="text-white">{currentUser.name}</strong> ({currentUser.role}).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin')}
            className="px-4 py-2 border border-slate-700 bg-[#0D1322] hover:bg-slate-800 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Back to Admin</span>
          </button>
          <button
            onClick={() => { checkApiHealth(); loadData(); }}
            disabled={loading || apiChecking}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading || apiChecking ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      {lastRefreshedAt && (
        <p className="text-[11px] text-slate-500 -mt-4">Last refreshed {lastRefreshedAt.toLocaleString('en-IN')}</p>
      )}

      {/* 1. Health */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" /> Site Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Backend API</span>
              {apiHealth ? (apiHealth.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />) : <Activity className="w-4 h-4 text-slate-500" />}
            </div>
            <div className="text-xl font-extrabold text-white mt-2">{apiHealth ? (apiHealth.ok ? 'Healthy' : 'Down') : apiChecking ? 'Checking…' : 'Not checked'}</div>
            <p className="text-xs text-slate-400 mt-1">{apiHealth ? `${apiHealth.detail} · ${apiHealth.ms}ms · ${formatRelativeTime(apiHealth.checkedAt)}` : 'GET /api/health'}</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Firestore (live sync)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-white mt-2">{store.hasLiveProducts() ? `${allProducts.length} products loaded` : 'Syncing live data…'}</div>
            <p className="text-xs text-slate-400 mt-1">Real-time listeners active for products, offers, stores and clicks. Database: ai-studio-findora-704a9471.</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Google Analytics (GA4)</span>
              {gaConfigured ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="text-xl font-extrabold text-white mt-2">{gaConfigured ? 'Tracking' : 'Not configured'}</div>
            <p className="text-xs text-slate-400 mt-1">
              {gaConfigured
                ? `Measurement ID ${gaId} is set in the deployed bundle.`
                : 'No G- measurement ID in the live bundle. Set VITE_GA_MEASUREMENT_ID in Vercel env vars, then redeploy — until then only on-site counters (below) are recorded.'}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Login & access */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-400" /> Login &amp; Access
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Signed in now</h3>
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between gap-3"><dt className="text-slate-400">Email</dt><dd className="text-white font-semibold break-all">{currentUser.email}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-400">Name</dt><dd className="text-white font-semibold">{currentUser.name}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-400">Role</dt><dd className="text-white font-semibold capitalize">{currentUser.role}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-400">User ID</dt><dd className="text-slate-300 font-mono text-xs break-all">{currentUser.id}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-400">Last login</dt><dd className="text-slate-300">{currentUser.lastLogin ? formatRelativeTime(currentUser.lastLogin) : '—'}</dd></div>
            </dl>
            <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              To grant someone admin: create a <code className="text-slate-200">users/{'{uid}'}</code> document in Firestore with{' '}
              <code className="text-slate-200">role: 'admin'</code>, or add their email to the bootstrapped admin list in code.
              If Google blocks a sign-in as an unrecognised device, approve the phone prompt on a trusted device — the Findora Gmail was verified this way on 14 Nov 2026.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Admin accounts (bootstrapped in code)</h3>
            <ul className="text-sm space-y-2">
              {BOOTSTRAPPED_ADMINS.map((a) => (
                <li key={a.email} className="flex flex-col">
                  <span className="text-white font-semibold break-all">{a.email}</span>
                  <span className="text-xs text-slate-400">{a.note}</span>
                </li>
              ))}
            </ul>
            <h3 className="text-sm font-bold text-white pt-2 border-t border-slate-800">Admin login history</h3>
            {loginHistory.length === 0 ? (
              <p className="text-xs text-slate-400">No admin login records yet — they appear after the first admin sign-in is logged.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {loginHistory.slice(0, 6).map((r) => (
                  <li key={r.userId} className="flex justify-between gap-3">
                    <span className="text-slate-200 break-all">{r.email} <span className="text-slate-500">({r.role})</span></span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{r.loginCount} logins · {formatRelativeTime(r.lastLogin)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 3. Tracker */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-amber-400" /> Tracker — what shoppers are doing
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Affiliate clicks</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{clicks.length}</div>
            <span className="text-xs text-slate-400 mt-1 block">Outbound to Amazon (recorded on-site)</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visitors (est.)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{funnel.totalVisitors.toLocaleString('en-IN')}</div>
            <span className="text-xs text-slate-400 mt-1 block">Modelled estimate, not a measured count</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product views (est.)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{funnel.productViews.toLocaleString('en-IN')}</div>
            <span className="text-xs text-slate-400 mt-1 block">From the same funnel model</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Click-through</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">{funnel.overallCtr}%</div>
            <span className="text-xs text-slate-400 mt-1 block">Clicks ÷ product views (modelled)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-amber-400" /> Top products by Amazon clicks</h3>
            {topByClicks.filter((p) => p.amazonClicks > 0).length === 0 ? (
              <p className="text-xs text-slate-400">No Amazon clicks recorded yet — clicks will appear here as shoppers tap through.</p>
            ) : (
              <ol className="text-sm space-y-2">
                {topByClicks.filter((p) => p.amazonClicks > 0).map((p, i) => (
                  <li key={p.productId} className="flex justify-between gap-3">
                    <span className="text-slate-200 truncate"><span className="text-slate-500 font-semibold mr-2">{i + 1}.</span>{p.name}</span>
                    <span className="text-white font-bold whitespace-nowrap">{p.amazonClicks} clicks · {p.affiliateCtr}% CTR</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" /> Top products by views</h3>
            {topByViews.filter((p) => p.views > 0).length === 0 ? (
              <p className="text-xs text-slate-400">No product views recorded on this device yet — views are counted per browser, so totals grow as shoppers browse.</p>
            ) : (
              <ol className="text-sm space-y-2">
                {topByViews.filter((p) => p.views > 0).map((p, i) => (
                  <li key={p.productId} className="flex justify-between gap-3">
                    <span className="text-slate-200 truncate"><span className="text-slate-500 font-semibold mr-2">{i + 1}.</span>{p.name}</span>
                    <span className="text-white font-bold whitespace-nowrap">{p.views} views</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Search className="w-4 h-4 text-emerald-400" /> Top searches</h3>
            {topSearches.length === 0 ? (
              <p className="text-xs text-slate-400">No searches recorded yet.</p>
            ) : (
              <ol className="text-sm space-y-2">
                {topSearches.slice(0, 10).map((s) => (
                  <li key={s.query} className="flex justify-between gap-3">
                    <span className="text-slate-200 truncate">“{s.query}”</span>
                    <span className="text-slate-400 whitespace-nowrap">{s.count}× · {s.resultsCount} results</span>
                  </li>
                ))}
              </ol>
            )}
            {zeroResultSearches.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <p className="text-xs font-bold text-amber-400 mb-2">Zero-result searches — products shoppers want but can't find:</p>
                <ul className="text-sm space-y-1">
                  {zeroResultSearches.slice(0, 8).map((s) => (
                    <li key={s.query} className="text-slate-300">“{s.query}” <span className="text-slate-500">({s.count}×)</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Recent Amazon clicks</h3>
            {recentClicks.length === 0 ? (
              <p className="text-xs text-slate-400">No outbound clicks recorded yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {recentClicks.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <span className="text-slate-200 truncate">{c.productName} <span className="text-slate-500">· {formatINR(c.price)}</span></span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatRelativeTime(c.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
            <h3 className="text-sm font-bold text-white mt-5 mb-3">Clicks by category</h3>
            {clicksByCategory.filter((c) => c.affiliateClicks > 0).length === 0 ? (
              <p className="text-xs text-slate-400">No clicks recorded yet — categories will rank here once shoppers tap through to Amazon.</p>
            ) : (
              <ul className="text-sm space-y-1.5">
                {clicksByCategory.filter((c) => c.affiliateClicks > 0).slice(0, 8).map((m) => (
                  <li key={m.name} className="flex justify-between gap-3">
                    <span className="text-slate-200 capitalize">{m.name}</span>
                    <span className="text-slate-400">{m.productCount} products · {m.affiliateClicks} clicks</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Honest note: clicks are NOT sales or earnings. Amazon Associates reports are the only source for orders and commissions — Findora never estimates revenue from clicks.
        </p>
      </section>

      {/* 4. Inventory */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" /> Data Inventory
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Products (total)', value: allProducts.length, sub: `${publishedProducts.length} published · ${draftProducts.length} drafts` },
            { label: 'Price offers', value: offers.length, sub: `${stores.length} store${stores.length === 1 ? '' : 's'} — Amazon India` },
            { label: 'Categories (real)', value: derivedCats.length, sub: `${categories.length} in Admin taxonomy` },
            { label: 'Brands', value: brandNames.length, sub: 'unique brands in the catalogue' },
            { label: 'Draft docs', value: draftDocs.length, sub: 'Drafts-page system (separate from product drafts)' },
            // The store's users list is local-only (localStorage cache of
            // locally registered users — there is no Firestore users
            // listener in the store), so it reads 0 even though the
            // Firestore `users` collection holds the real accounts.
            // userMetrics comes from a direct Firestore read — that is
            // the truth for the registered-users count.
            { label: 'Registered users', value: userMetrics?.totalUsers ?? users.length, sub: userMetrics ? `${userMetrics.googleAuthUsers} Google · ${userMetrics.emailAuthUsers} email` : '—' },
            { label: 'Affiliate clicks', value: clicks.length, sub: 'recorded outbound clicks' },
            { label: 'Search events', value: topSearches.reduce((a, s) => a + s.count, 0), sub: `${topSearches.length} distinct queries` },
          ].map((c) => (
            <div key={c.label} className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.label}</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{c.value.toLocaleString('en-IN')}</div>
              <span className="text-xs text-slate-400 mt-1 block">{c.sub}</span>
            </div>
          ))}
        </div>

        {/* Tag audit */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-2">Affiliate tag audit — every offer, checked live</h3>
          <p className="text-sm text-slate-300">
            <span className="text-emerald-400 font-bold">{tagAudit.onNewTag}</span> of {tagAudit.total} offers carry the current tag{' '}
            <code className="text-slate-100">arya0611-21</code>
            {tagAudit.onOtherLink > 0 && (
              <> · <span className="text-amber-400 font-bold">{tagAudit.onOtherLink}</span> still on an old/other link (check them — usually a leftover short link)</>
            )}
            {tagAudit.missing > 0 && (
              <> · <span className="text-rose-400 font-bold">{tagAudit.missing}</span> with no affiliate URL at all</>
            )}
            {tagAudit.onOtherLink === 0 && tagAudit.missing === 0 && ' — all clean.'}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Known leftovers: the published-draft “Draft” rows in Product Management (the original draft records) still show “Affiliate Missing” — do NOT re-fill them, or live duplicates are created.
          </p>
        </div>

        {/* Categories */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-3">Live categories (derived from real products)</h3>
          <div className="flex flex-wrap gap-2">
            {derivedCats.map((c) => (
              <button
                key={c.key}
                onClick={() => onNavigate(`/category/${c.slug}`)}
                className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/60 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-white transition-colors"
              >
                {c.name} · {c.count}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
