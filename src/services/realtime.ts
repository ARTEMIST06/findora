/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Realtime on-site events for the admin-only analytics dashboard (PR #43).
//
// Two Firestore collections, both admin-read-only:
//   - `siteEvents`: one doc per page view / product view. This is the site's
//     own record of traffic. Page views used to go to GA4 only (events that
//     can never be read back from the browser), so the dashboard had no view
//     data of its own and showed invented numbers. These docs are the fix.
//   - `activeSessions`: one doc per tab session, heartbeat-updated so the
//     dashboard can show "active now" (lastSeen within the last 5 minutes).
//
// COST GUARDS (Firebase Spark free plan: 50k reads/day, 20k writes/day;
// current traffic is tens of visitors/day, so this stays far under quota):
//   - 1 write per page view / product view, nothing else per navigation.
//   - Session heartbeat is 1 write per 60s per open tab, throttled.
//   - Dashboard queries are bounded: latest 500 docs per collection.
//   - All writes are fire-and-forget: a failed write is swallowed, never
//     allowed to break the page for a shopper.
//
// PRIVACY: no PII, no full URLs (query strings / tokens are stripped),
// referrer is stored as hostname only, no IP address is ever collected.
// Traffic numbers are confidential — the dashboard is admin-only and the
// brand proposal deliberately hides them until a brand applies.

const SESSION_KEY = 'findora_rt_session_v1';
// Same key analytics.ts uses for the session UTM (captureUtmFromUrl stores
// it there on every page view), so a visitor who arrives with
// ?utm_source=pinterest keeps that attribution for the whole session.
const UTM_STORAGE_KEY = 'findora_utm_session_v1';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const HEARTBEAT_MS = 60 * 1000;
const DEDUP_MS = 2000;

export interface SiteEventDoc {
  type: 'view' | 'product_view';
  path: string;
  referrer: string;
  source: string;
  utm_source?: string;
  productId?: string;
  productName?: string;
  category?: string;
  sessionId: string;
  ts: string;
}

export interface ActiveSessionDoc {
  sessionId: string;
  lastSeen: string;
  path: string;
  source: string;
}

// One id per tab session (sessionStorage is per-tab by design).
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Map a referrer hostname (or a utm_source value) to one canonical label.
export function canonicalSourceFromHostname(hostname: string): string {
  const h = (hostname || '').toLowerCase();
  if (!h) return 'Direct';
  if (h.includes('google.')) return 'Google Search';
  if (h.includes('pinterest.')) return 'Pinterest';
  if (h.includes('youtube.') || h === 'youtu.be') return 'YouTube';
  if (h.includes('instagram.')) return 'Instagram';
  if (h.includes('facebook.') || h.includes('fb.com')) return 'Facebook';
  if (h.includes('bing.')) return 'Bing';
  if (h.includes('duckduckgo.')) return 'DuckDuckGo';
  return 'Other';
}

function utmSourceFromSession(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const params = new URL(window.location.href).searchParams;
    const fromUrl = params.get('utm_source')?.trim();
    if (fromUrl) return fromUrl.slice(0, 40);
    const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { utm_source?: string };
      if (parsed?.utm_source) return parsed.utm_source.slice(0, 40);
    }
  } catch {
    // fall through
  }
  return undefined;
}

function referrerHostname(): string {
  if (typeof window === 'undefined' || !document.referrer) return '';
  try {
    return new URL(document.referrer).hostname.replace(/^www\./, '').slice(0, 100);
  } catch {
    return '';
  }
}

// utm_source wins when present (a campaign link is explicit attribution);
// otherwise the referrer hostname decides. A known utm value maps to the
// same canonical label as its referrer; any other utm_source is kept as-is
// so real campaign names are never collapsed into "Other".
export function deriveSource(): { source: string; utmSource?: string } {
  const utmSource = utmSourceFromSession();
  if (utmSource) {
    const mapped = canonicalSourceFromHostname(utmSource);
    return { source: mapped === 'Other' || mapped === 'Direct' ? utmSource : mapped, utmSource };
  }
  return { source: canonicalSourceFromHostname(referrerHostname()) };
}

function cleanPath(path: string): string {
  return (path || '/').split('?')[0].split('#')[0].slice(0, 200) || '/';
}

// --- Firestore plumbing (dynamic imports, same pattern as analytics.ts) ---

async function addSiteEvent(doc: SiteEventDoc): Promise<void> {
  try {
    const { db } = await import('../lib/firebase');
    const { collection, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'siteEvents'), doc);
  } catch {
    // Events are best-effort: never break the shopper's page.
  }
}

let lastHeartbeatAt = 0;
let heartbeatStarted = false;

async function writeSession(path: string, source: string): Promise<void> {
  try {
    const { db } = await import('../lib/firebase');
    const { doc, setDoc } = await import('firebase/firestore');
    const sessionId = getSessionId();
    await setDoc(
      doc(db, 'activeSessions', sessionId),
      { sessionId, lastSeen: new Date().toISOString(), path, source } satisfies ActiveSessionDoc,
      { merge: true }
    );
    lastHeartbeatAt = Date.now();
  } catch {
    // Best-effort, same as events.
  }
}

// Session touch, throttled to at most one write per HEARTBEAT_MS unless
// forced (the interval heartbeat forces its own tick).
function touchSession(path: string, source: string, force = false): void {
  if (!force && Date.now() - lastHeartbeatAt < HEARTBEAT_MS) return;
  void writeSession(path, source);
}

export function startRealtimeHeartbeat(): void {
  if (heartbeatStarted || typeof window === 'undefined') return;
  heartbeatStarted = true;
  window.setInterval(() => {
    const { source } = deriveSource();
    touchSession(cleanPath(window.location.pathname), source, true);
  }, HEARTBEAT_MS);
}

// --- Public logging API ---

const dedup = new Map<string, number>();

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = dedup.get(key);
  if (last && now - last < DEDUP_MS) return true;
  dedup.set(key, now);
  if (dedup.size > 200) {
    const cutoff = now - 60_000;
    for (const [k, t] of dedup.entries()) {
      if (t < cutoff) dedup.delete(k);
    }
  }
  return false;
}

// One doc per page view. Called on every route change (App.tsx) next to the
// existing GA4 page_view call, which stays untouched.
export function logPageView(path: string): void {
  if (typeof window === 'undefined') return;
  const clean = cleanPath(path);
  if (isDuplicate(`view:${clean}`)) return;
  startRealtimeHeartbeat();
  const { source, utmSource } = deriveSource();
  const doc: SiteEventDoc = {
    type: 'view',
    path: clean,
    referrer: referrerHostname(),
    source,
    sessionId: getSessionId(),
    ts: new Date().toISOString(),
  };
  if (utmSource) doc.utm_source = utmSource;
  void addSiteEvent(doc);
  touchSession(clean, source);
}

// One doc per product view. Called inside analytics.trackViewProduct so
// every existing call site benefits without being touched.
export function logProductView(product: { id: string; name: string; category?: string }): void {
  if (typeof window === 'undefined' || !product?.id) return;
  if (isDuplicate(`product_view:${product.id}`)) return;
  startRealtimeHeartbeat();
  const { source, utmSource } = deriveSource();
  const doc: SiteEventDoc = {
    type: 'product_view',
    productId: product.id,
    productName: (product.name || 'Unknown Product').slice(0, 120),
    category: (product.category || 'General').slice(0, 60),
    path: cleanPath(window.location.pathname),
    referrer: referrerHostname(),
    source,
    sessionId: getSessionId(),
    ts: new Date().toISOString(),
  };
  if (utmSource) doc.utm_source = utmSource;
  void addSiteEvent(doc);
  touchSession(doc.path, source);
}

export const REALTIME_ACTIVE_WINDOW_MS = ACTIVE_WINDOW_MS;
