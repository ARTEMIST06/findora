/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Analytics & Audit Console — REALTIME rewrite (PR #43).
//
// What this page shows now is real Firestore data, updated live:
//   - Page/product views: Firestore `siteEvents` (written by
//     services/realtime.ts on every page view and product view).
//   - Affiliate clicks: Firestore `clicks` (written by
//     store.trackAffiliateClick on every "Check Price" click).
//   - Active now: Firestore `activeSessions` (60s heartbeat per tab).
//   - Searches, users, logins, audit logs: as before (already real).
//
// What was REMOVED in this rewrite (all of it was invented):
//   - Hardcoded traffic-source percentages (46% Google / 28% Direct ...)
//     times an invented visitor total.
//   - Hardcoded geography (82% India / 9% US / ...) and device fallbacks
//     (68/28/4) and invented engagement figures (2m 44s, 68.4%, +12% ...).
//   - The visitor funnel, whose visitors were max(users*4, clicks*4, 48).
//   - Product views from the ADMIN's own browser localStorage plus an
//     invented +2 floor, and clicks from the local cache instead of the
//     Firestore `clicks` collection.
//   - CTR is now real: clicks / views, 0 when views are 0.
// Empty states show 0 honestly. On-site events only exist from the day
// this shipped — the page says so instead of backfilling invented history.
// Historical traffic lives in GA4 (linked, never read back here).

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Activity,
  Users,
  MousePointerClick,
  Eye,
  Search,
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ExternalLink,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Globe,
  UserCheck,
} from 'lucide-react';
import { useFindoraStore } from '../../services/store';
import { SEOHead } from '../../components/common/SEOHead';
import {
  analytics,
  AggregatedSearchQuery,
  UserMetricsRecord,
} from '../../services/analytics';
import {
  fetchAuditLogs,
  fetchAdminLoginHistory,
  AuditLogEntry,
  AdminLoginHistoryRecord,
} from '../../services/audit';
import { formatRelativeTime } from '../../utils/formatters';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import {
  canonicalSourceFromHostname,
  REALTIME_ACTIVE_WINDOW_MS,
} from '../../services/realtime';
import type { SiteEventDoc, ActiveSessionDoc } from '../../services/realtime';

interface AnalyticsDashboardProps {
  onNavigate: (path: string) => void;
}

type DateRangeOption = 'today' | '7days' | '28days' | '90days' | 'custom';

// Firestore `clicks` doc shape (written by store.trackAffiliateClick).
interface ClickDoc {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  category: string;
  price: number;
  timestamp: string;
  trafficSource: string;
  device: string;
}

interface ProductRow {
  productId: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  image?: string;
  views: number;
  clicks: number;
  ctr: number;
}

interface SourceRow {
  source: string;
  sessions: number;
  views: number;
  clicks: number;
}

interface CategoryRow {
  category: string;
  productCount: number;
  views: number;
  clicks: number;
  ctr: number;
}

interface ActivityItem {
  key: string;
  kind: 'view' | 'product_view' | 'click';
  title: string;
  sub: string;
  ts: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// Dashboard queries are bounded (PR #43 cost guard): latest 500 events /
// clicks, latest 200 sessions. At current traffic (tens of visitors/day)
// that covers a full week with room to spare.
const QUERY_LIMIT = 500;

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const currentUser = store.getCurrentUser();
  const isAuthLoading = store.isAuthLoading();

  // Role Access Verification
  const isBootstrappedAdmin =
    currentUser?.email?.toLowerCase() === 'aryasingh2366@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'admin@findora.com';
  const isAdmin = currentUser?.role === 'admin' || isBootstrappedAdmin;
  const isEditor = currentUser?.role === 'editor' || currentUser?.email === 'editor@findora.com';

  // Filters & Period State
  const [dateRange, setDateRange] = useState<DateRangeOption>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Analytics Data States
  const [topSearches, setTopSearches] = useState<AggregatedSearchQuery[]>([]);
  const [zeroResultSearches, setZeroResultSearches] = useState<AggregatedSearchQuery[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginHistoryRecord[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetricsRecord>({
    totalUsers: 0,
    newRegistrations: 0,
    activeUsers: 0,
    googleAuthUsers: 0,
    emailAuthUsers: 0,
  });

  // Live realtime data (Firestore onSnapshot listeners, admin-only reads)
  const [siteEvents, setSiteEvents] = useState<SiteEventDoc[]>([]);
  const [liveClicks, setLiveClicks] = useState<ClickDoc[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionDoc[]>([]);
  // Set when a live listener is refused (e.g. the new firestore.rules for
  // siteEvents / activeSessions have not been published yet). The page
  // still loads everything else and says so honestly instead of faking 0s.
  const [liveBlocked, setLiveBlocked] = useState<string | null>(null);

  // Ticking clock so "active now" ages sessions out even when no snapshot
  // arrives (a tab that closed stops heartbeating and drops out after 5m).
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  // Product Table Filter & Sort
  const [productSearch, setProductSearch] = useState('');
  const [productSortBy, setProductSortBy] = useState<'views' | 'clicks' | 'ctr'>('clicks');

  // Audit Logs Filter State
  const [auditActorFilter, setAuditActorFilter] = useState<'all' | 'admin' | 'editor'>('all');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Active section tab for clean focus
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'searches' | 'categories' | 'users' | 'logins' | 'audit'
  >('overview');

  // Load the one-time analytics data (searches, audit, logins, users)
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [searchesRes, logsRes, loginsRes, usersRes] = await Promise.all([
        analytics.fetchSearchAnalytics(),
        fetchAuditLogs(150),
        fetchAdminLoginHistory(),
        analytics.fetchAuthenticatedUserMetrics(),
      ]);

      setTopSearches(searchesRes.topSearches);
      setZeroResultSearches(searchesRes.zeroResultSearches);
      setAuditLogs(logsRes);
      setLoginHistory(loginsRes);
      setUserMetrics(usersRes);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Error loading analytics data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Live listeners: siteEvents, clicks, activeSessions. These replace the
  // old one-time getDocs + localStorage reads entirely.
  useEffect(() => {
    if (!isAdmin) return;
    const unsubs: Array<() => void> = [];
    unsubs.push(
      onSnapshot(
        query(collection(db, 'siteEvents'), orderBy('ts', 'desc'), limit(QUERY_LIMIT)),
        (snap) => {
          // Internal-traffic cleanup (PR #52): events recorded before the
          // write-side guard shipped include /admin page views from our own
          // runs. Drop them at read time so historical counts are honest too.
          setSiteEvents(
            snap.docs
              .map((d) => d.data() as SiteEventDoc)
              .filter((e) => !(e.path === '/admin' || e.path?.startsWith('/admin/')))
          );
          setLiveBlocked((prev) => (prev === 'siteEvents' ? null : prev));
        },
        (err) => {
          console.warn('siteEvents listener failed:', err);
          setLiveBlocked('siteEvents');
        }
      )
    );
    unsubs.push(
      onSnapshot(
        query(collection(db, 'clicks'), orderBy('timestamp', 'desc'), limit(QUERY_LIMIT)),
        (snap) => {
          setLiveClicks(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClickDoc, 'id'>) }))
          );
        },
        (err) => {
          console.warn('clicks listener failed:', err);
        }
      )
    );
    unsubs.push(
      onSnapshot(
        query(collection(db, 'activeSessions'), orderBy('lastSeen', 'desc'), limit(200)),
        (snap) => {
          setActiveSessions(snap.docs.map((d) => d.data() as ActiveSessionDoc));
          setLiveBlocked((prev) => (prev === 'activeSessions' ? null : prev));
        },
        (err) => {
          console.warn('activeSessions listener failed:', err);
          setLiveBlocked('activeSessions');
        }
      )
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [isAdmin]);

  // Products from the catalogue (for names/images in the product table)
  const allProducts = useMemo(() => store.getAllProductsWithPrices(true), [store]);

  // --- Date range: Today and 7 days are real. On-site events only exist
  // for the last 7 days, so 28/90/custom are clamped to the same 7-day
  // window and the page says so — no invented history is backfilled.
  const startOfTodayMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const rangeStartMs = dateRange === 'today' ? startOfTodayMs : Date.now() - SEVEN_DAYS_MS;
  const isRangeClamped = dateRange === '28days' || dateRange === '90days' || dateRange === 'custom';

  const eventsInRange = useMemo(
    () => siteEvents.filter((e) => Date.parse(e.ts) >= rangeStartMs),
    [siteEvents, rangeStartMs]
  );
  const clicksInRange = useMemo(
    () => liveClicks.filter((c) => Date.parse(c.timestamp) >= rangeStartMs),
    [liveClicks, rangeStartMs]
  );

  // --- KPI values: all counted from Firestore, 0 when empty ---
  const viewsToday = useMemo(
    () =>
      siteEvents.filter((e) => e.type === 'view' && Date.parse(e.ts) >= startOfTodayMs).length,
    [siteEvents, startOfTodayMs]
  );
  const views7d = useMemo(
    () =>
      siteEvents.filter((e) => e.type === 'view' && Date.parse(e.ts) >= Date.now() - SEVEN_DAYS_MS)
        .length,
    [siteEvents]
  );
  // Unique visitors = distinct sessions (people, not page loads). Shown next
  // to views so "47 views" is never misread as "47 people".
  const visitorsToday = useMemo(
    () =>
      new Set(
        siteEvents
          .filter((e) => e.type === 'view' && Date.parse(e.ts) >= startOfTodayMs)
          .map((e) => e.sessionId)
      ).size,
    [siteEvents, startOfTodayMs]
  );
  const visitors7d = useMemo(
    () =>
      new Set(
        siteEvents
          .filter((e) => e.type === 'view' && Date.parse(e.ts) >= Date.now() - SEVEN_DAYS_MS)
          .map((e) => e.sessionId)
      ).size,
    [siteEvents]
  );
  const clicksToday = useMemo(
    () => liveClicks.filter((c) => Date.parse(c.timestamp) >= startOfTodayMs).length,
    [liveClicks, startOfTodayMs]
  );
  const clicks7d = useMemo(
    () => liveClicks.filter((c) => Date.parse(c.timestamp) >= Date.now() - SEVEN_DAYS_MS).length,
    [liveClicks]
  );
  const activeNow = useMemo(
    () =>
      activeSessions.filter((s) => nowMs - Date.parse(s.lastSeen) <= REALTIME_ACTIVE_WINDOW_MS)
        .length,
    [activeSessions, nowMs]
  );
  const topProductByClicks = useMemo(() => {
    const counts = new Map<string, { name: string; clicks: number }>();
    for (const c of clicksInRange) {
      const cur = counts.get(c.productId) || { name: c.productName || 'Unknown Product', clicks: 0 };
      cur.clicks += 1;
      counts.set(c.productId, cur);
    }
    let top: { name: string; clicks: number } | null = null;
    for (const v of counts.values()) {
      if (!top || v.clicks > top.clicks) top = v;
    }
    return top;
  }, [clicksInRange]);
  const topSource = useMemo(() => {
    const sessions = new Map<string, Set<string>>();
    for (const e of eventsInRange) {
      let s = sessions.get(e.source);
      if (!s) {
        s = new Set<string>();
        sessions.set(e.source, s);
      }
      s.add(e.sessionId);
    }
    let top: { source: string; sessions: number } | null = null;
    for (const [source, s] of sessions) {
      if (!top || s.size > top.sessions) top = { source, sessions: s.size };
    }
    return top;
  }, [eventsInRange]);

  // Earliest collected event, for the honest "collected since" note.
  const collectedSinceLabel = useMemo(() => {
    if (siteEvents.length === 0) return null;
    const times = siteEvents
      .map((e) => Date.parse(e.ts))
      .filter((n) => !Number.isNaN(n));
    if (times.length === 0) return null;
    return new Date(Math.min(...times)).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [siteEvents]);

  // --- Product performance: real views (siteEvents product_view) and real
  // clicks (Firestore clicks) per product. CTR = clicks / views, 0 when
  // views are 0. Only products with activity in range are listed.
  const productRows: ProductRow[] = useMemo(() => {
    const viewCounts = new Map<string, number>();
    for (const e of eventsInRange) {
      if (e.type === 'product_view' && e.productId) {
        viewCounts.set(e.productId, (viewCounts.get(e.productId) || 0) + 1);
      }
    }
    const clickCounts = new Map<string, number>();
    for (const c of clicksInRange) {
      if (c.productId) clickCounts.set(c.productId, (clickCounts.get(c.productId) || 0) + 1);
    }
    const rows = allProducts
      .map((p) => {
        const views = viewCounts.get(p.id) || 0;
        const clicks = clickCounts.get(p.id) || 0;
        return {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          category: p.category,
          brand: p.brand || 'Generic',
          image: p.images && p.images.length > 0 ? p.images[0] : undefined,
          views,
          clicks,
          ctr: views > 0 ? Math.round((clicks / views) * 100) : 0,
        };
      })
      .filter((r) => r.views > 0 || r.clicks > 0);
    rows.sort((a, b) => {
      if (productSortBy === 'clicks') return b.clicks - a.clicks;
      if (productSortBy === 'views') return b.views - a.views;
      return b.ctr - a.ctr;
    });
    return rows;
  }, [allProducts, eventsInRange, clicksInRange, productSortBy]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return productRows;
    const q = productSearch.toLowerCase();
    return productRows.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [productRows, productSearch]);

  // --- Traffic sources: real aggregates from siteEvents (sessions + views)
  // and Firestore clicks (clicks per source, via the click's referrer host).
  const sourceRows: SourceRow[] = useMemo(() => {
    const map = new Map<string, { sessions: Set<string>; views: number }>();
    for (const e of eventsInRange) {
      // Views here = page views only, same definition as the KPI cards
      // (product views are counted in Product Analytics, not here).
      if (e.type !== 'view') continue;
      const cur = map.get(e.source) || { sessions: new Set<string>(), views: 0 };
      cur.sessions.add(e.sessionId);
      cur.views += 1;
      map.set(e.source, cur);
    }
    const clickMap = new Map<string, number>();
    for (const c of clicksInRange) {
      const src =
        c.trafficSource === 'Direct'
          ? 'Direct'
          : canonicalSourceFromHostname(c.trafficSource || '');
      clickMap.set(src, (clickMap.get(src) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([source, v]) => ({
        source,
        sessions: v.sessions.size,
        views: v.views,
        clicks: clickMap.get(source) || 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [eventsInRange, clicksInRange]);

  // --- Category performance: real views (product_view events) and real
  // clicks (Firestore clicks carry their product's category).
  const categoryRows: CategoryRow[] = useMemo(() => {
    const map = new Map<string, { views: number; clicks: number }>();
    for (const e of eventsInRange) {
      if (e.type !== 'product_view') continue;
      const cat = e.category || 'General';
      const cur = map.get(cat) || { views: 0, clicks: 0 };
      cur.views += 1;
      map.set(cat, cur);
    }
    for (const c of clicksInRange) {
      const cat = c.category || 'General';
      const cur = map.get(cat) || { views: 0, clicks: 0 };
      cur.clicks += 1;
      map.set(cat, cur);
    }
    const productCounts = new Map<string, number>();
    for (const p of allProducts) {
      const cat = p.category || 'General';
      productCounts.set(cat, (productCounts.get(cat) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([category, v]) => ({
        category,
        productCount: productCounts.get(category) || 0,
        views: v.views,
        clicks: v.clicks,
        ctr: v.views > 0 ? Math.round((v.clicks / v.views) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views);
  }, [eventsInRange, clicksInRange, allProducts]);

  // --- Recent activity: latest 20 events (views + clicks), live.
  const recentActivity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    for (const e of siteEvents.slice(0, 20)) {
      items.push({
        key: `e-${e.ts}-${e.sessionId}-${e.path}`,
        kind: e.type,
        title: e.type === 'product_view' ? e.productName || 'Product view' : e.path,
        sub: e.source,
        ts: e.ts,
      });
    }
    for (const c of liveClicks.slice(0, 20)) {
      items.push({
        key: `c-${c.id}`,
        kind: 'click',
        title: c.productName || 'Affiliate click',
        sub: `${c.storeName || 'Amazon'} · ${c.trafficSource || 'Direct'}`,
        ts: c.timestamp,
      });
    }
    return items.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 20);
  }, [siteEvents, liveClicks]);

  // Clicks by Store Breakdown (Firestore clicks)
  const clicksByStore = useMemo(() => {
    const storeMap: Record<string, { storeId: string; storeName: string; clicks: number; totalValue: number }> = {};
    clicksInRange.forEach((c) => {
      const storeId = c.storeId || 'store-amazon';
      const storeName = c.storeName || (storeId === 'store-amazon' ? 'Amazon India' : storeId.replace('store-', '').toUpperCase());
      if (!storeMap[storeId]) {
        storeMap[storeId] = { storeId, storeName, clicks: 0, totalValue: 0 };
      }
      storeMap[storeId].clicks += 1;
      storeMap[storeId].totalValue += (c.price || 0);
    });

    const list = Object.values(storeMap).sort((a, b) => b.clicks - a.clicks);
    const totalClicks = Math.max(clicksInRange.length, 1);
    return list.map((s) => ({
      ...s,
      percentage: Math.round((s.clicks / totalClicks) * 100),
      avgPrice: s.clicks > 0 ? Math.round(s.totalValue / s.clicks) : 0,
    }));
  }, [clicksInRange]);

  // Clicks Over Time Breakdown (Past 7 Days timeline, Firestore clicks)
  // Day buckets use LOCAL dates, matching the KPI "today" definition
  // (local midnight). Clicks outside the 7-day window are ignored — they
  // used to be dumped into the "Today" bar, inventing clicks that never
  // happened today (PR #53).
  const clicksOverTime = useMemo(() => {
    const localDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
    const days: { date: string; label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      days.push({ date: localDateStr(d), label, count: 0 });
    }

    liveClicks.forEach((c) => {
      const t = Date.parse(c.timestamp || '');
      if (Number.isNaN(t)) return;
      const match = days.find((d) => d.date === localDateStr(new Date(t)));
      if (match) match.count += 1;
    });

    return days;
  }, [liveClicks]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    let list = [...auditLogs];

    if (auditActorFilter !== 'all') {
      list = list.filter((log) => log.actorRole === auditActorFilter);
    }

    if (auditActionFilter !== 'all') {
      list = list.filter((log) => log.action === auditActionFilter);
    }

    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase();
      list = list.filter(
        (log) =>
          log.actorEmail.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.targetName?.toLowerCase().includes(q) ||
          log.targetType.toLowerCase().includes(q)
      );
    }

    return list;
  }, [auditLogs, auditActorFilter, auditActionFilter, auditSearchQuery]);

  // Export audit logs as JSON
  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredAuditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `findora-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 1. Loading State
  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Verifying administrative credentials...</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect or Prompt
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Admin Authentication Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Findora Analytics and Audit Console is restricted to authenticated administrators. Please sign in with your administrator credentials.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/login')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
        >
          Sign In as Administrator
        </button>
      </div>
    );
  }

  // 3. Access Denied (for Editor or Shopper roles)
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 bg-white border border-red-100 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-600 border border-red-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isEditor
              ? 'Your account is authorized with the Editor role. The Analytics and Security Audit Dashboard is restricted exclusively to Administrators.'
              : 'Administrator privileges are required to view private business analytics, revenue conversion funnels, and system audit records.'}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {isEditor && (
            <button
              onClick={() => onNavigate('/admin')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              Return to Admin CMS
            </button>
          )}
          <button
            onClick={() => onNavigate('/')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Go to Store Homepage
          </button>
        </div>
      </div>
    );
  }

  const isGA4Active = analytics.isGA4Configured();
  const ga4Id = analytics.getGA4MeasurementId();

  return (
    <div className="admin-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen text-slate-900">
      <SEOHead
        title="Analytics & Audit Console | Findora"
        description="Findora internal analytics, visitor behavior, and security audit log."
        canonicalPath="/admin/analytics"
        noIndex={true}
      />
      {/* Top Header & Context Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-600 rounded-2xl shadow-lg shadow-blue-500/10">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Findora Analytics & Audit
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
                  Admin Exclusive
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Realtime visitor views, affiliate clicks, search insights, and security audit log — all counted from Firestore.
              </p>
            </div>
          </div>
        </div>

        {/* Header Controls & Period Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateRange === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateRange === '7days' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('28days')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateRange === '28days' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              28 Days
            </button>
            <button
              onClick={() => setDateRange('90days')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateRange === '90days' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateRange === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isRefreshing}
            title="Refresh Analytics Metrics"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => onNavigate('/admin')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to CMS</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers when 'custom' selected */}
      {dateRange === 'custom' && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Start Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">End Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <span className="text-slate-600 text-[11px]">On-site events only go back 7 days — custom ranges show the same 7-day window.</span>
        </div>
      )}

      {/* Live events blocked? (rules not published yet) */}
      {liveBlocked && (
        <div className="p-4 rounded-2xl border bg-amber-50/80 border-amber-200/80 text-amber-900 flex flex-col sm:flex-row items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Live on-site events are not flowing yet.</p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              The Firestore rules for <span className="font-mono font-semibold">{liveBlocked}</span> have
              not been published yet, so this page cannot read the new events. Publish{' '}
              <span className="font-mono font-semibold">firestore.rules</span> from the Firebase
              console (Firestore &gt; Rules), then refresh this page. Clicks, searches, users and
              audit logs below still load from the existing rules.
            </p>
          </div>
        </div>
      )}

      {/* GA4 Setup & Privacy Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          isGA4Active
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200/80 text-amber-900'
        }`}
      >
        <div className="flex items-start gap-3">
          {isGA4Active ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold">
                {isGA4Active
                  ? `Google Analytics 4 Active (Measurement ID: ${ga4Id})`
                  : 'Google Analytics 4 is not configured yet.'}
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/80 border border-current">
                {isGA4Active ? 'Live Stream' : 'Internal Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              {isGA4Active
                ? 'External visitor traffic, page views, and conversion events are actively synchronizing to your Google Analytics property without recording PII. Historical traffic lives in GA4 — the numbers below are on-site events only.'
                : 'To enable live Google Analytics 4 visitor metrics, add VITE_GA_MEASUREMENT_ID in project environment settings. Findora is capturing internal affiliate clicks, search trends, and audit activity safely.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3 text-[11px] text-slate-600">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>Open GA4</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {formatRelativeTime(lastRefreshedAt.toISOString())}</span>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold text-slate-600">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: BarChart3 },
          { id: 'products', label: `Product Analytics (${productRows.length})`, icon: ShoppingBag },
          { id: 'searches', label: `Search Trends (${topSearches.length})`, icon: Search },
          { id: 'categories', label: 'Category Metrics', icon: Layers },
          { id: 'users', label: 'User Accounts', icon: Users },
          { id: 'logins', label: 'Login History', icon: UserCheck },
          { id: 'audit', label: `Security Audit Log (${auditLogs.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: OVERVIEW & KPIS (all real, counted from Firestore) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Key Performance Indicators</span>
              <span className="text-xs font-normal text-slate-600">({dateRange} aggregate)</span>
            </h2>
          </div>

          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Views Today */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Views Today</span>
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {viewsToday.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600">Page views recorded today · internal visits excluded</div>
            </div>

            {/* Views Last 7 Days */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Views · 7 Days</span>
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {views7d.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600">Page views, last 7 days</div>
            </div>

            {/* Visitors Today (unique sessions = people, not page loads) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Visitors Today</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {visitorsToday.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600">
                Unique visitors (sessions) · 7 days: {visitors7d.toLocaleString()}
              </div>
            </div>

            {/* Clicks Today */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Clicks Today</span>
                <MousePointerClick className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">
                {clicksToday.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600">Outbound affiliate clicks today</div>
            </div>

            {/* Clicks Last 7 Days */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Clicks · 7 Days</span>
                <MousePointerClick className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">
                {clicks7d.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600">Outbound affiliate clicks, last 7 days</div>
            </div>

            {/* Active Now */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Active Now</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                {activeNow.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600">Sessions active in the last 5 minutes</div>
            </div>

            {/* Top Product by Clicks */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Top Product · Clicks</span>
                <ShoppingBag className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate" title={topProductByClicks?.name || ''}>
                {topProductByClicks ? topProductByClicks.name : '—'}
              </div>
              <div className="text-[11px] text-slate-600">
                {topProductByClicks ? `${topProductByClicks.clicks} clicks in this range` : 'No clicks in this range yet'}
              </div>
            </div>

            {/* Top Traffic Source */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider">Top Traffic Source</span>
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate" title={topSource?.source || ''}>
                {topSource ? topSource.source : '—'}
              </div>
              <div className="text-[11px] text-slate-600">
                {topSource ? `${topSource.sessions} sessions in this range` : 'No sessions in this range yet'}
              </div>
            </div>
          </div>

          {/* Honest scope note */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-900">On-site events collected since{' '}
              {collectedSinceLabel || 'today'}.</span>{' '}
            Every number above is counted from Firestore — 0 where nothing has been recorded yet.
            {isRangeClamped && (
              <>
                {' '}28-day, 90-day and custom ranges show the same 7-day window: on-site events
                only go back 7 days, and no history is invented.
              </>
            )}{' '}
            Historical traffic lives in GA4.
          </div>

          {/* Traffic Sources + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Sources (real aggregates) */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Traffic Sources</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">Sessions, views and clicks by real source</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {sourceRows.length > 0 ? (
                  sourceRows.map((source) => (
                    <div key={source.source} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{source.source}</span>
                        <span className="text-[10px] text-slate-600">
                          {source.sessions} sessions • {source.views} views
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">{source.clicks} clicks</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">outbound</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-slate-600 text-xs">
                    No on-site events in this range yet.
                  </p>
                )}
              </div>
            </div>

            {/* Recent Activity Feed (live) */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Recent Activity</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">Latest views and clicks, updating live</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <div key={item.key} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            item.kind === 'click'
                              ? 'bg-amber-100 text-amber-800'
                              : item.kind === 'product_view'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.kind === 'click' ? 'Click' : item.kind === 'product_view' ? 'Product view' : 'View'}
                        </span>
                        <span className="font-semibold text-slate-900 truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-600 block">{item.sub}</span>
                        <span className="text-[10px] text-slate-600">{formatRelativeTime(item.ts)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-slate-600 text-xs">
                    No activity yet — views and clicks will appear here live once visitors arrive.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Affiliate Performance (By Store & Over Time, Firestore clicks) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clicks by Store */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span>Clicks by Store</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">Distribution of outbound affiliate redirects across merchants</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  {clicksInRange.length} Total Clicks
                </span>
              </div>

              {clicksByStore.length > 0 ? (
                <div className="space-y-4">
                  {clicksByStore.map((store) => (
                    <div key={store.storeId} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{store.storeName}</span>
                          {store.storeId === 'store-amazon' && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Primary
                            </span>
                          )}
                        </span>
                        <span className="text-slate-600 font-bold">
                          {store.clicks} clicks ({store.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            store.storeId === 'store-amazon' ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${store.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-600 bg-slate-50 rounded-2xl border border-slate-100">
                  No outbound affiliate clicks recorded yet.
                </div>
              )}
            </div>

            {/* Clicks Over Time */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Clicks Over Time</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">Daily trajectory of shopper outbound purchase intent</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Past 7 Days
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-2">
                {clicksOverTime.map((day) => {
                  const maxClicks = Math.max(...clicksOverTime.map((d) => d.count), 1);
                  const heightPct = Math.max(12, Math.round((day.count / maxClicks) * 100));
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1.5 text-center">
                      <span className="text-[11px] font-bold text-slate-800">{day.count}</span>
                      <div className="w-full bg-slate-100 h-24 rounded-xl flex items-end p-1 overflow-hidden">
                        <div
                          className="w-full bg-emerald-500 rounded-lg transition-all"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-600 truncate w-full font-medium" title={day.label}>
                        {day.label.split(',')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: PRODUCT PERFORMANCE ANALYTICS (real views + clicks) */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Product Performance Table</span>
              </h3>
              <p className="text-xs text-slate-600">
                Real views from on-site events and real outbound clicks per product. Only products with activity in this range are listed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Product search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-semibold">Sort by:</span>
                <select
                  value={productSortBy}
                  onChange={(e) => setProductSortBy(e.target.value as any)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 bg-white font-medium"
                >
                  <option value="clicks">Most Clicked</option>
                  <option value="views">Most Viewed</option>
                  <option value="ctr">Highest CTR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Views</th>
                  <th className="py-3 px-3 text-right">Clicks</th>
                  <th className="py-3 px-3 text-right">CTR</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <tr key={p.productId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                          <div className="truncate">
                            <span className="truncate block font-bold text-slate-900">{p.name}</span>
                            <span className="text-[10px] text-slate-600 font-normal">{p.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 capitalize">{p.category}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">{p.views}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-amber-600">{p.clicks}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                            p.ctr > 25
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.ctr > 10
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.ctr}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onNavigate(`/product/${p.slug}`)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-600">
                      No product views or clicks in this range yet. On-site events are collected
                      from {collectedSinceLabel || 'today'} — until a shopper views a product, this
                      table honestly shows nothing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: SEARCH ANALYTICS */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'searches') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Searches */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Top Search Queries</span>
                </h3>
                <p className="text-[11px] text-slate-600">Most frequent shopper keyword queries</p>
              </div>
              <span className="text-xs font-bold text-blue-600">{topSearches.length} tracked</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {topSearches.length > 0 ? (
                topSearches.map((s, idx) => (
                  <div key={s.query} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-bold text-slate-600 text-[11px]">{idx + 1}</span>
                      <span className="font-bold text-slate-900 capitalize">{s.query}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                      <span>{s.resultsCount} products</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700">
                        {s.count} searches
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-slate-600 text-xs">
                  No search queries logged yet. Test searching in the top navigation bar!
                </p>
              )}
            </div>
          </div>

          {/* Zero Result Searches (Product Opportunities) */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Searches with No Matching Products</span>
                </h3>
                <p className="text-[11px] text-slate-600">Catalog expansion opportunities based on shopper intent</p>
              </div>
              <span className="text-xs font-bold text-amber-600">{zeroResultSearches.length} opportunities</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {zeroResultSearches.length > 0 ? (
                zeroResultSearches.map((s) => (
                  <div key={s.query} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block capitalize">{s.query}</span>
                      <span className="text-[10px] text-slate-600">
                        Last searched {formatRelativeTime(s.lastSearched)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {s.count} requests
                      </span>
                      <button
                        onClick={() => onNavigate('/admin')}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-600 text-xs space-y-1">
                  <p>All user searches currently match catalog products!</p>
                  <p className="text-[10px]">When a search returns 0 items, it will automatically populate here as a product addition opportunity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: CATEGORY PERFORMANCE (real views + clicks) */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Category Performance</span>
              </h3>
              <p className="text-[11px] text-slate-600">Real views and clicks by catalog category</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {categoryRows.length > 0 ? (
              categoryRows.map((cat) => (
                <div key={cat.category} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 capitalize block">{cat.category}</span>
                    <span className="text-[10px] text-slate-600">
                      {cat.productCount} products listed • {cat.views} views
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-600 block">{cat.clicks} clicks</span>
                    <span className="text-[10px] font-semibold text-slate-600">{cat.ctr}% CTR</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-600 text-xs">
                No category views or clicks in this range yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: AUTHENTICATED USERS */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'users') && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Authenticated User Accounts</span>
              </h3>
              <p className="text-xs text-slate-600">Registered shopper and administrator user statistics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Total Accounts</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{userMetrics.totalUsers}</div>
              <span className="text-[10px] text-slate-600">In Firestore users</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Active (30d)</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{userMetrics.activeUsers}</div>
              <span className="text-[10px] text-emerald-600">Recent session activity</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 uppercase">New Registrations</span>
              <div className="text-2xl font-black text-blue-900 mt-1">{userMetrics.newRegistrations}</div>
              <span className="text-[10px] text-blue-600">Within last 30 days</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[11px] font-bold text-purple-800 uppercase">Google Sign-In</span>
              <div className="text-2xl font-black text-purple-900 mt-1">{userMetrics.googleAuthUsers}</div>
              <span className="text-[10px] text-purple-600">OAuth authenticated</span>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-800 uppercase">Email / Password</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">{userMetrics.emailAuthUsers}</div>
              <span className="text-[10px] text-indigo-600">Direct credentials</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: ADMIN & EDITOR LOGIN HISTORY */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'logins') && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Privileged Account Login History</span>
              </h3>
              <p className="text-xs text-slate-600">
                Audit history of administrator and editor sessions. Zero credentials or passwords recorded.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">User & Email</th>
                  <th className="py-3 px-3">Assigned Role</th>
                  <th className="py-3 px-3">Last Login Time</th>
                  <th className="py-3 px-3 text-right">Login Sessions</th>
                  <th className="py-3 px-3">Recent Auth Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loginHistory.length > 0 ? (
                  loginHistory.map((rec) => (
                    <tr key={rec.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{rec.name}</span>
                        <span className="text-[11px] text-slate-600">{rec.email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rec.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rec.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">
                          {formatRelativeTime(rec.lastLogin)}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(rec.lastLogin).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {rec.loginCount}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {rec.recentSessions.length > 0 ? (
                            rec.recentSessions.map((s) => (
                              <span
                                key={s.id}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]"
                              >
                                {s.method} • {formatRelativeTime(s.timestamp)}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600">Active session</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-600">
                      No privileged login records located in security log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: SECURITY & PRIVILEGED AUDIT LOG */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'audit') && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  Privileged Operations Audit Log
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  Immutable
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Tamper-proof record of admin and editor actions: product creations, publish transitions, affiliate link updates, and AI generation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportAuditLogs}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Audit Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search audit events by user, target..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Actor filter */}
            <select
              value={auditActorFilter}
              onChange={(e) => setAuditActorFilter(e.target.value as any)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white font-medium"
            >
              <option value="all">All Actors (Admin & Editor)</option>
              <option value="admin">Administrators Only</option>
              <option value="editor">Editors Only</option>
            </select>

            {/* Action filter */}
            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white font-medium"
            >
              <option value="all">All Privileged Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="PRODUCT_CREATED">PRODUCT_CREATED</option>
              <option value="PRODUCT_EDITED">PRODUCT_EDITED</option>
              <option value="PRODUCT_DUPLICATED">PRODUCT_DUPLICATED</option>
              <option value="PRODUCT_REVIEWED">PRODUCT_REVIEWED</option>
              <option value="PRODUCT_PUBLISHED">PRODUCT_PUBLISHED</option>
              <option value="PRODUCT_UNPUBLISHED">PRODUCT_UNPUBLISHED</option>
              <option value="PRODUCT_DELETED">PRODUCT_DELETED</option>
              <option value="AFFILIATE_LINK_ADDED">AFFILIATE_LINK_ADDED</option>
              <option value="AFFILIATE_LINK_UPDATED">AFFILIATE_LINK_UPDATED</option>
              <option value="AMAZON_URL_UPDATED">AMAZON_URL_UPDATED</option>
              <option value="IMAGE_ADDED">IMAGE_ADDED</option>
              <option value="IMAGE_UPDATED">IMAGE_UPDATED</option>
              <option value="IMAGE_REMOVED">IMAGE_REMOVED</option>
              <option value="AI_CONTENT_GENERATED">AI_CONTENT_GENERATED</option>
              <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            </select>
          </div>

          {/* Audit Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log) => {
                    const isExpanded = expandedAuditId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                              {log.actorEmail}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">
                              UID: {log.actorUid.slice(0, 8)}...
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.actorRole === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.actorRole}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                log.action.includes('PUBLISHED')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.action.includes('DELETED')
                                  ? 'bg-red-100 text-red-800'
                                  : log.action.includes('CREATED') || log.action.includes('DUPLICATED')
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : log.action.includes('AI')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <span className="font-semibold text-slate-900 truncate block">
                              {log.targetName || log.targetId || 'System Entity'}
                            </span>
                            <span className="text-[10px] text-slate-600 capitalize">
                              Type: {log.targetType}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-800 font-medium block">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {log.details ? (
                              <button
                                onClick={() => setExpandedAuditId(isExpanded ? null : log.id)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 transition-colors inline-flex items-center gap-1"
                              >
                                <span>Payload</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && log.details && (
                          <tr className="bg-slate-50">
                            <td colSpan={6} className="p-4">
                              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-600 space-y-1">
                      <p>No audit events match the selected criteria.</p>
                      <p className="text-[11px]">Actions like publishing products, saving drafts, and running AI Copilot are recorded here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
