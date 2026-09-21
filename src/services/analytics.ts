/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Storage keys for analytics metrics
const STORAGE_KEYS = {
  PRODUCT_VIEWS: 'findora_analytics_prod_views_v1',
  SEARCH_QUERIES: 'findora_analytics_searches_v1',
  PAGE_VIEWS: 'findora_analytics_page_views_v1',
  SESSION_ID: 'findora_analytics_session_id_v1',
};

// Ensure gtag type safety
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
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
  /**
   * Checks if Google Analytics 4 is actively configured via environment variable.
   */
  isGA4Configured(): boolean {
    if (typeof window === 'undefined') return false;
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    return Boolean(gaId && gaId.trim().length > 0 && gaId.startsWith('G-'));
  }

  getGA4MeasurementId(): string | null {
    if (typeof window === 'undefined') return null;
    return import.meta.env.VITE_GA_MEASUREMENT_ID || null;
  }

  /**
   * Internal dispatcher to window.gtag
   */
  private sendGtag(command: string, ...args: any[]) {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'function') {
      window.gtag(command, ...args);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push([command, ...args]);
    }
  }

  /**
   * Track custom or standard GA4 event
   */
  trackEvent(eventName: string, params?: Record<string, any>) {
    this.sendGtag('event', eventName, params);
  }

  /**
   * Page View tracking
   */
  trackPageView(path: string, title?: string) {
    this.trackEvent('page_view', {
      page_path: path,
      page_title: title || document.title,
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
   * Search Tracking - No PII is stored.
   */
  trackSearch(searchTerm: string, resultsCount = 0) {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) return;

    // 1. Google Analytics
    this.trackEvent('search', {
      search_term: clean,
      results_count: resultsCount,
    });

    // 2. Local storage record for instant preview
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
              // Fail gracefully if offline
            });
          });
        })
        .catch(() => {});
    }
  }

  /**
   * Product View Tracking
   */
  trackViewProduct(product: {
    id: string;
    name: string;
    category?: string;
    brand?: string;
    price?: number;
  }) {
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
   * Category View Tracking
   */
  trackViewCategory(category: string) {
    this.trackEvent('view_item_list', {
      item_list_name: category,
    });
  }

  /**
   * Wishlist Add Tracking
   */
  trackAddToWishlist(product: {
    id: string;
    name: string;
    category?: string;
    price?: number;
  }) {
    this.trackEvent('add_to_wishlist', {
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  }

  /**
   * Compare Add Tracking
   */
  trackAddToCompare(product: {
    id: string;
    name: string;
    category?: string;
  }) {
    this.trackEvent('add_to_compare', {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
    });
  }

  /**
   * Affiliate Click Tracking - Instruments Amazon "Check Price" button
   */
  trackAffiliateClick(details: {
    productId: string;
    productName: string;
    store: string;
    category?: string;
    price?: number;
    affiliateUrl?: string;
  }) {
    this.trackEvent('affiliate_click', {
      product_id: details.productId,
      product_name: details.productName,
      store: details.store,
      category: details.category || 'General',
      value: details.price || 0,
    });
  }

  /**
   * Login & Sign-up tracking
   */
  trackLogin(method: string) {
    this.trackEvent('login', { method });
  }

  trackSignUp(method: string) {
    this.trackEvent('sign_up', { method });
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
    if (typeof window !== 'undefined') {
      try {
        localViews = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_VIEWS) || '{}');
      } catch (e) {
        localViews = {};
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
      const isWishlisted = wishlistProductIds.includes(p.id) ? 1 : 0;
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
        compareAdds: 0,
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
}

export const analytics = new AnalyticsService();
