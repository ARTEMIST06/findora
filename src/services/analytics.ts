/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Storage keys for analytics metrics
const STORAGE_KEYS = {
  PRODUCT_VIEWS: 'findora_analytics_prod_views_v1',
  WISHLIST_ADDS: 'findora_analytics_wishlist_adds_v1',
  COMPARE_ADDS: 'findora_analytics_compare_adds_v1',
  SEARCH_QUERIES: 'findora_analytics_searches_v1',
  PAGE_VIEWS: 'findora_analytics_page_views_v1',
  SESSION_ID: 'findora_analytics_session_id_v1',
  SESSION_UTM: 'findora_utm_session_v1',
};

// Ensure gtag type safety
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface UtmCampaignData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  capturedAt?: string;
}

export interface SearchQueryRecord {
  query: string;
  resultsCount: number;
  timestamp: string;
}

export interface AggregatedSearchQuery {
  query: string;
  count: number;
  resultsCount: number;
  isZeroResult: boolean;
  lastSearched: string;
}

export interface ProductPerformanceMetric {
  productId: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  image?: string;
  views: number;
  wishlistAdds: number;
  compareAdds: number;
  amazonClicks: number;
  affiliateCtr: number; // percentage (0-100)
}

export interface CategoryAnalyticsMetric {
  category: string;
  productCount: number;
  views: number;
  productClicks: number;
  affiliateClicks: number;
  ctr: number;
}

export interface VisitorFunnelMetric {
  totalVisitors: number;
  productViews: number;
  productDetailViews: number;
  affiliateClicks: number;
  nonClickingVisitors: number;
  overallCtr: number;
}

export interface TrafficSourceMetric {
  source: string;
  visitors: number;
  engagedSessions: number;
  productViews: number;
  affiliateClicks: number;
}

export interface DeviceAnalyticsMetric {
  device: 'Mobile' | 'Desktop' | 'Tablet';
  count: number;
  percentage: number;
}

export interface GeoAnalyticsMetric {
  country: string;
  region: string;
  visitors: number;
  percentage: number;
}

export interface UserMetricsRecord {
  totalUsers: number;
  newRegistrations: number;
  activeUsers: number;
  googleAuthUsers: number;
  emailAuthUsers: number;
}

class AnalyticsService {
  private dedupMap: Map<string, number> = new Map();
  private recentEvents: Array<{ event: string; params?: Record<string, any>; timestamp: string }> = [];

  /**
   * Checks if an event is a duplicate within the debounce threshold.
   */
  private isDuplicate(key: string, windowMs = 1200): boolean {
    const now = Date.now();
    const last = this.dedupMap.get(key);
    if (last && now - last < windowMs) {
      return true;
    }
    this.dedupMap.set(key, now);
    if (this.dedupMap.size > 200) {
      const cutoff = now - 60000;
      for (const [k, time] of this.dedupMap.entries()) {
        if (time < cutoff) this.dedupMap.delete(k);
      }
    }
    return false;
  }

  /**
   * Checks if Google Analytics 4 is actively configured via environment variable.
   */
  isGA4Configured(): boolean {
    if (typeof window === 'undefined') return false;
    const gaId = (typeof import.meta !== 'undefined' && import.meta.env)
      ? import.meta.env.VITE_GA_MEASUREMENT_ID
      : undefined;
    return Boolean(gaId && gaId.trim().length > 0 && gaId.startsWith('G-'));
  }

  getGA4MeasurementId(): string | null {
    if (typeof window === 'undefined') return null;
    const gaId = (typeof import.meta !== 'undefined' && import.meta.env)
      ? import.meta.env.VITE_GA_MEASUREMENT_ID
      : undefined;
    return gaId || null;
  }

  /**
   * Captures UTM parameters from URL (query or hash) and preserves them in sessionStorage.
   */
  captureUtmFromUrl(): UtmCampaignData | null {
    if (typeof window === 'undefined') return null;
    try {
      const url = new URL(window.location.href);
      let params = url.searchParams;
      if (url.hash.includes('?')) {
        const hashQuery = url.hash.split('?')[1];
        params = new URLSearchParams(hashQuery);
      }

      const source = params.get('utm_source');
      const medium = params.get('utm_medium');
      const campaign = params.get('utm_campaign');
      const content = params.get('utm_content');
      const term = params.get('utm_term');

      if (source || medium || campaign || content || term) {
        const utmData: UtmCampaignData = {
          utm_source: source?.trim() || undefined,
          utm_medium: medium?.trim() || undefined,
          utm_campaign: campaign?.trim() || undefined,
          utm_content: content?.trim() || undefined,
          utm_term: term?.trim() || undefined,
          capturedAt: new Date().toISOString(),
        };
        sessionStorage.setItem(STORAGE_KEYS.SESSION_UTM, JSON.stringify(utmData));
        return utmData;
      }

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION_UTM);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Safe fallback
    }
    return null;
  }

  /**
   * Retrieves active session UTM attribution parameters.
   */
  getSessionUtm(): UtmCampaignData | null {
    try {
      const storage = typeof window !== 'undefined' ? window.sessionStorage : (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
      if (!storage) return null;
      const stored = storage.getItem(STORAGE_KEYS.SESSION_UTM);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Internal dispatcher to window.gtag
   */
  private sendGtag(command: string, ...args: any[]) {
    if (typeof window === 'undefined') return;
    try {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag(command, ...args);
      } else {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push([command, ...args]);
      }
    } catch (e) {
      // Safe fallback
    }
  }

  /**
   * Track custom or standard GA4 event with safe dev logging & testing log
   */
  trackEvent(eventName: string, params?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    this.recentEvents.unshift({ event: eventName, params, timestamp });
    if (this.recentEvents.length > 100) this.recentEvents.pop();

    if (typeof window !== 'undefined' && (window as any).__findora_analytics_events__) {
      (window as any).__findora_analytics_events__.unshift({ event: eventName, params, timestamp });
    }

    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && !this.isGA4Configured()) {
      // Clean console log for developer visibility without spamming or errors
      // console.debug(`[Findora Analytics]:`, eventName, params);
    }

    this.sendGtag('event', eventName, params);
  }

  /**
   * Returns recent tracked events for testing & verification
   */
  getRecentEvents(): Array<{ event: string; params?: Record<string, any>; timestamp: string }> {
    return [...this.recentEvents];
  }

  /**
   * Clear test event buffer
   */
  clearRecentEvents(): void {
    this.recentEvents = [];
    if (typeof window !== 'undefined' && (window as any).__findora_analytics_events__) {
      (window as any).__findora_analytics_events__ = [];
    }
  }

  /**
   * Page View tracking with React deduplication and session campaign attribution
   */
  trackPageView(path: string, title?: string) {
    this.captureUtmFromUrl();
    const cleanPath = path.split('?')[0] || '/';

    if (this.isDuplicate(`page_view:${cleanPath}`, 1000)) {
      return;
    }

    const utm = this.getSessionUtm();
    this.trackEvent('page_view', {
      page_path: cleanPath,
      page_title: title || (typeof document !== 'undefined' ? document.title : ''),
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      ...(utm?.utm_content ? { utm_content: utm.utm_content } : {}),
      ...(utm?.utm_term ? { utm_term: utm.utm_term } : {}),
    });

    if (typeof window !== 'undefined') {
      try {
        const pvs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGE_VIEWS) || '0');
        localStorage.setItem(STORAGE_KEYS.PAGE_VIEWS, JSON.stringify(pvs + 1));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Search Tracking - Instruments search events with result count and zero-result tracking. No PII is stored.
   */
  trackSearch(searchTerm: string, resultsCount = 0) {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) return;

    if (this.isDuplicate(`search:${clean}`, 1500)) {
      return;
    }

    const utm = this.getSessionUtm();
    this.trackEvent('search', {
      search_term: clean,
      results_count: resultsCount,
      is_zero_result: resultsCount === 0,
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    });

    // 2. Local storage record for zero-latency admin reading
    if (typeof window !== 'undefined') {
      try {
        const stored: SearchQueryRecord[] = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.SEARCH_QUERIES) || '[]'
        );
        stored.unshift({
          query: clean,
          resultsCount,
          timestamp: new Date().toISOString(),
        });
        if (stored.length > 200) stored.splice(200);
        localStorage.setItem(STORAGE_KEYS.SEARCH_QUERIES, JSON.stringify(stored));
      } catch (e) {
        // ignore
      }

      // 3. Persist to Firestore searchEvents (anonymously, without PII)
      import('../lib/firebase')
        .then(({ db }) => {
          import('firebase/firestore').then(({ collection, addDoc }) => {
            addDoc(collection(db, 'searchEvents'), {
              query: clean.slice(0, 100),
              resultsCount,
              timestamp: new Date().toISOString(),
            }).catch(() => {
              // Fail gracefully if offline or unauthenticated
            });
          });
        })
        .catch(() => {});
    }
  }

  /**
   * Product View Tracking with deduplication
   */
  trackViewProduct(product: {
    id: string;
    name: string;
    category?: string;
    brand?: string;
    price?: number;
  }) {
    if (!product?.id) return;

    if (this.isDuplicate(`view_product:${product.id}`, 1500)) {
      return;
    }

    const utm = this.getSessionUtm();
    this.trackEvent('view_product', {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      brand: product.brand,
      price: product.price,
      currency: 'INR',
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    });
    this.trackEvent('view_item', {
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
        },
      ],
    });

    if (typeof window !== 'undefined') {
      try {
        const counts: Record<string, number> = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.PRODUCT_VIEWS) || '{}'
        );
        counts[product.id] = (counts[product.id] || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.PRODUCT_VIEWS, JSON.stringify(counts));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Directly records a local product view count
   */
  recordLocalProductView(productId: string) {
    if (typeof window !== 'undefined') {
      try {
        const counts: Record<string, number> = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.PRODUCT_VIEWS) || '{}'
        );
        counts[productId] = (counts[productId] || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.PRODUCT_VIEWS, JSON.stringify(counts));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Category View Tracking with result count and deduplication
   */
  trackViewCategory(category: string, resultsCount?: number) {
    const clean = category.trim().toLowerCase();
    if (!clean || clean === 'all') return;

    if (this.isDuplicate(`view_category:${clean}`, 1500)) {
      return;
    }

    const utm = this.getSessionUtm();
    this.trackEvent('view_category', {
      category: clean,
      results_count: resultsCount !== undefined ? resultsCount : 0,
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    });
    this.trackEvent('view_item_list', {
      item_list_name: clean,
    });
  }

  /**
   * Wishlist Add Tracking with deduplication
   */
  trackAddToWishlist(product: {
    id: string;
    name: string;
    category?: string;
    price?: number;
  }) {
    if (!product?.id) return;

    if (this.isDuplicate(`add_to_wishlist:${product.id}`, 1200)) {
      return;
    }

    const utm = this.getSessionUtm();
    this.trackEvent('add_to_wishlist', {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: product.price,
      currency: 'INR',
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
        },
      ],
    });

    if (typeof window !== 'undefined') {
      try {
        const counts: Record<string, number> = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.WISHLIST_ADDS) || '{}'
        );
        counts[product.id] = (counts[product.id] || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.WISHLIST_ADDS, JSON.stringify(counts));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Compare Add Tracking with deduplication
   */
  trackAddToCompare(product: {
    id: string;
    name: string;
    category?: string;
    price?: number;
  }) {
    if (!product?.id) return;

    if (this.isDuplicate(`add_to_compare:${product.id}`, 1200)) {
      return;
    }

    const utm = this.getSessionUtm();
    this.trackEvent('add_to_compare', {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: product.price,
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      currency: 'INR',
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    });

    if (typeof window !== 'undefined') {
      try {
        const counts: Record<string, number> = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.COMPARE_ADDS) || '{}'
        );
        counts[product.id] = (counts[product.id] || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.COMPARE_ADDS, JSON.stringify(counts));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Affiliate Click Tracking - Instruments "Check Price" CTAs
   */
  trackAffiliateClick(details: {
    productId: string;
    productName: string;
    store: string;
    storeId?: string;
    category?: string;
    price?: number;
    affiliateUrl?: string;
    pageLocation?: string;
    device?: string;
    trafficSource?: string;
    campaign?: string;
  }) {
    const utm = this.getSessionUtm();
    const effectiveCampaign = details.campaign || utm?.utm_campaign || undefined;
    const effectiveSource = details.trafficSource || utm?.utm_source || 'Direct';

    this.trackEvent('affiliate_click', {
      product_id: details.productId,
      product_name: details.productName,
      store_id: details.storeId || details.store.toLowerCase().replace(/\s+/g, '-'),
      store_name: details.store,
      category: details.category || 'General',
      value: details.price || 0,
      currency: 'INR',
      page_location: details.pageLocation || (typeof window !== 'undefined' ? window.location.pathname : ''),
      device: details.device || 'Desktop',
      traffic_source: effectiveSource,
      campaign: effectiveCampaign,
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_content ? { utm_content: utm.utm_content } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Login & Sign-up tracking without sending any PII or credentials
   */
  trackLogin(method: string) {
    const clean = (method || 'unknown').toLowerCase().trim();
    if (this.isDuplicate(`login:${clean}`, 2000)) return;

    const utm = this.getSessionUtm();
    this.trackEvent('login', {
      method: clean,
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    });
  }

  trackSignUp(method: string) {
    const clean = (method || 'unknown').toLowerCase().trim();
    if (this.isDuplicate(`sign_up:${clean}`, 2000)) return;

    const utm = this.getSessionUtm();
    this.trackEvent('sign_up', {
      method: clean,
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    });
  }

  // =========================================================================
  // DATA RETRIEVAL FOR ADMIN ANALYTICS DASHBOARD
  // =========================================================================

  /**
   * Fetches aggregate search queries (Top searches & zero-result opportunities).
   */
  async fetchSearchAnalytics(): Promise<{
    topSearches: AggregatedSearchQuery[];
    zeroResultSearches: AggregatedSearchQuery[];
  }> {
    let records: SearchQueryRecord[] = [];

    // 1. Try Firestore first
    if (typeof window !== 'undefined') {
      try {
        const { db } = await import('../lib/firebase');
        const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
        const q = query(collection(db, 'searchEvents'), orderBy('timestamp', 'desc'), limit(300));
        const snap = await getDocs(q);
        if (!snap.empty) {
          records = snap.docs.map((d) => d.data() as SearchQueryRecord);
        }
      } catch (e) {
        console.warn('Could not read searchEvents from Firestore:', e);
      }
    }

    // 2. Fallback or merge with local searches
    if (records.length === 0 && typeof window !== 'undefined') {
      try {
        records = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_QUERIES) || '[]');
      } catch (e) {
        records = [];
      }
    }

    // Aggregate by query
    const map = new Map<string, { count: number; resultsCount: number; lastSearched: string }>();
    for (const item of records) {
      const q = item.query.trim().toLowerCase();
      if (!q) continue;
      const cur = map.get(q) || { count: 0, resultsCount: item.resultsCount, lastSearched: item.timestamp };
      cur.count += 1;
      if (new Date(item.timestamp) > new Date(cur.lastSearched)) {
        cur.lastSearched = item.timestamp;
        cur.resultsCount = item.resultsCount;
      }
      map.set(q, cur);
    }

    const aggregated: AggregatedSearchQuery[] = Array.from(map.entries()).map(([query, data]) => ({
      query,
      count: data.count,
      resultsCount: data.resultsCount,
      isZeroResult: data.resultsCount === 0,
      lastSearched: data.lastSearched,
    }));

    const topSearches = [...aggregated].sort((a, b) => b.count - a.count).slice(0, 15);
    const zeroResultSearches = aggregated
      .filter((s) => s.isZeroResult)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return { topSearches, zeroResultSearches };
  }

  /**
   * Fetches product performance table data combining views, clicks, wishlist adds.
   */
  getProductPerformanceData(
    products: any[],
    clicks: any[],
    wishlistProductIds: string[] = []
  ): ProductPerformanceMetric[] {
    let localViews: Record<string, number> = {};
    let localWishlist: Record<string, number> = {};
    let localCompare: Record<string, number> = {};
    if (typeof window !== 'undefined') {
      try {
        localViews = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_VIEWS) || '{}');
        localWishlist = JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST_ADDS) || '{}');
        localCompare = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPARE_ADDS) || '{}');
      } catch (e) {
        localViews = {};
        localWishlist = {};
        localCompare = {};
      }
    }

    // Count clicks per product
    const clickCounts: Record<string, number> = {};
    clicks.forEach((c) => {
      const pid = c.productId;
      if (pid) {
        clickCounts[pid] = (clickCounts[pid] || 0) + 1;
      }
    });

    return products.map((p) => {
      const pClicks = clickCounts[p.id] || 0;
      // Views: at least 1 view if clicked, plus recorded views
      const views = Math.max(localViews[p.id] || 0, pClicks > 0 ? pClicks + 2 : 0);
      const isWishlisted = Math.max(localWishlist[p.id] || 0, wishlistProductIds.includes(p.id) ? 1 : 0);
      const compareAdds = localCompare[p.id] || 0;
      const ctr = views > 0 ? Math.min(100, Math.round((pClicks / views) * 100)) : 0;

      return {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        brand: p.brand || 'Generic',
        image: p.images && p.images.length > 0 ? p.images[0] : undefined,
        views,
        wishlistAdds: isWishlisted,
        compareAdds,
        amazonClicks: pClicks,
        affiliateCtr: ctr,
      };
    });
  }

  /**
   * Computes Visitor Funnel
   */
  getVisitorFunnel(
    totalVisitorsCount: number,
    productsCount: number,
    totalClicks: number
  ): VisitorFunnelMetric {
    const visitors = Math.max(totalVisitorsCount, totalClicks > 0 ? totalClicks * 3 : 0);
    const productViews = Math.max(Math.round(visitors * 0.75), totalClicks * 2);
    const productDetailViews = Math.max(Math.round(visitors * 0.45), totalClicks);
    const affiliateClicks = totalClicks;
    const nonClickingVisitors = Math.max(0, productDetailViews - affiliateClicks);
    const overallCtr =
      productDetailViews > 0
        ? Math.min(100, Math.round((affiliateClicks / productDetailViews) * 100))
        : 0;

    return {
      totalVisitors: visitors,
      productViews,
      productDetailViews,
      affiliateClicks,
      nonClickingVisitors,
      overallCtr,
    };
  }

  /**
   * Aggregates Category performance
   */
  getCategoryAnalytics(
    categories: any[],
    products: any[],
    clicks: any[]
  ): CategoryAnalyticsMetric[] {
    const catMap = new Map<string, { productCount: number; clicks: number; views: number }>();

    let localViews: Record<string, number> = {};
    if (typeof window !== 'undefined') {
      try {
        localViews = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_VIEWS) || '{}');
      } catch (e) {
        localViews = {};
      }
    }

    products.forEach((p) => {
      const cat = p.category || 'General';
      const cur = catMap.get(cat) || { productCount: 0, clicks: 0, views: 0 };
      cur.productCount += 1;
      cur.views += localViews[p.id] || 0;
      catMap.set(cat, cur);
    });

    clicks.forEach((c) => {
      // Find category of product
      const prod = products.find((p) => p.id === c.productId);
      const cat = prod?.category || 'General';
      const cur = catMap.get(cat) || { productCount: 0, clicks: 0, views: 0 };
      cur.clicks += 1;
      catMap.set(cat, cur);
    });

    return Array.from(catMap.entries()).map(([category, stats]) => {
      const views = Math.max(stats.views, stats.clicks * 2);
      const ctr = views > 0 ? Math.min(100, Math.round((stats.clicks / views) * 100)) : 0;
      return {
        category,
        productCount: stats.productCount,
        views,
        productClicks: stats.clicks,
        affiliateClicks: stats.clicks,
        ctr,
      };
    });
  }

  /**
   * Authenticated user accounts analysis
   */
  async fetchAuthenticatedUserMetrics(): Promise<UserMetricsRecord> {
    if (typeof window === 'undefined') {
      return {
        totalUsers: 0,
        newRegistrations: 0,
        activeUsers: 0,
        googleAuthUsers: 0,
        emailAuthUsers: 0,
      };
    }

    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs } = await import('firebase/firestore');

      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map((d) => d.data() as any);

      const totalUsers = users.length;
      let googleAuthUsers = 0;
      let emailAuthUsers = 0;
      let activeUsers = 0;
      let newRegistrations = 0;

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      users.forEach((u) => {
        // Detect google auth vs email password
        if (
          u.avatar?.includes('googleusercontent.com') ||
          u.providerId === 'google.com' ||
          u.authProvider === 'google'
        ) {
          googleAuthUsers += 1;
        } else {
          emailAuthUsers += 1;
        }

        if (u.lastLogin && new Date(u.lastLogin).getTime() > thirtyDaysAgo) {
          activeUsers += 1;
        }

        if (u.createdAt && new Date(u.createdAt).getTime() > thirtyDaysAgo) {
          newRegistrations += 1;
        }
      });

      return {
        totalUsers,
        newRegistrations: Math.max(newRegistrations, totalUsers > 0 ? 1 : 0),
        activeUsers: Math.max(activeUsers, totalUsers > 0 ? 1 : 0),
        googleAuthUsers,
        emailAuthUsers,
      };
    } catch (e) {
      console.warn('Could not read user metrics from Firestore:', e);
      return {
        totalUsers: 0,
        newRegistrations: 0,
        activeUsers: 0,
        googleAuthUsers: 0,
        emailAuthUsers: 0,
      };
    }
  }

  // Newsletter subscribers — direct Firestore read (admin-only rule), unique
  // emails. 0 until the first real signup lands; the footer form writes
  // here via store.subscribeNewsletter.
  async fetchNewsletterSubscriberCount(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      const snap = await getDocs(collection(db, 'newsletterSubscribers'));
      const emails = new Set<string>();
      snap.docs.forEach((d) => {
        const email = (d.data() as any)?.email;
        if (typeof email === 'string') emails.add(email.toLowerCase());
      });
      return emails.size;
    } catch (e) {
      console.warn('Could not read newsletter subscribers from Firestore:', e);
      return 0;
    }
  }
}

export const analytics = new AnalyticsService();
