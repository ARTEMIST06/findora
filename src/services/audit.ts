/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_EDITED'
  | 'PRODUCT_DUPLICATED'
  | 'PRODUCT_REVIEWED'
  | 'PRODUCT_PUBLISHED'
  | 'PRODUCT_UNPUBLISHED'
  | 'PRODUCT_DELETED'
  | 'AFFILIATE_LINK_ADDED'
  | 'AFFILIATE_LINK_UPDATED'
  | 'AMAZON_URL_UPDATED'
  | 'IMAGE_ADDED'
  | 'IMAGE_UPDATED'
  | 'IMAGE_REMOVED'
  | 'AI_CONTENT_GENERATED'
  | 'ROLE_CHANGED';

export type TargetType = 'product' | 'draft' | 'offer' | 'user' | 'store' | 'system' | 'image';

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorRole: 'admin' | 'editor' | 'shopper';
  actorEmail: string;
  action: AuditAction;
  targetType: TargetType;
  targetId?: string;
  targetName?: string;
  timestamp: string; // ISO 8601
  details?: Record<string, any>;
}

export interface AdminLoginHistoryRecord {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  lastLogin: string;
  loginCount: number;
  recentSessions: Array<{
    id: string;
    timestamp: string;
    method?: string;
  }>;
}

const LOCAL_AUDIT_KEY = 'findora_audit_logs_v1';

function getLocalAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalAuditLog(entry: AuditLogEntry) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalAuditLogs();
    list.unshift(entry);
    if (list.length > 300) list.splice(300);
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(list));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Logs a privileged application action into the Firestore auditLogs collection.
 * Strictly immutable and protected by security rules.
 */
export async function logAuditEvent(
  params: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<string | null> {
  const eventId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = params.timestamp || new Date().toISOString();

  const entry: AuditLogEntry = {
    ...params,
    id: eventId,
    timestamp,
  };

  // Keep a local copy for resilience / instant preview
  saveLocalAuditLog(entry);

  if (typeof window === 'undefined') return eventId;

  try {
    const { db, auth } = await import('../lib/firebase');
    const { doc, setDoc } = await import('firebase/firestore');

    const currentUser = auth.currentUser;
    // Security rules require actorUid == request.auth.uid if authenticated
    const actorUid = currentUser?.uid || params.actorUid;

    const payload: any = {
      id: eventId,
      actorUid,
      actorRole: params.actorRole,
      actorEmail: params.actorEmail,
      action: params.action,
      targetType: params.targetType,
      timestamp,
    };

    if (params.targetId) payload.targetId = params.targetId;
    if (params.targetName) payload.targetName = params.targetName;
    if (params.details) payload.details = params.details;

    await setDoc(doc(db, 'auditLogs', eventId), payload);
    return eventId;
  } catch (err) {
    console.warn('[Audit Log] Failed to persist event to Firestore:', err);
    return eventId;
  }
}

/**
 * Fetches audit logs from Firestore, falling back to local storage if Firestore is unreachable.
 */
export async function fetchAuditLogs(limitCount = 100): Promise<AuditLogEntry[]> {
  if (typeof window === 'undefined') return [];

  try {
    const { db } = await import('../lib/firebase');
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as AuditLogEntry);
      return items;
    }
  } catch (e) {
    console.warn('[Audit Log] Firestore query failed or restricted, falling back to cached logs:', e);
  }

  // Fallback to local logs
  return getLocalAuditLogs().slice(0, limitCount);
}

/**
 * Fetches login history for Admin and Editor users.
 */
export async function fetchAdminLoginHistory(): Promise<AdminLoginHistoryRecord[]> {
  if (typeof window === 'undefined') return [];

  try {
    const { db } = await import('../lib/firebase');
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

    // 1. Fetch Users to get admins and editors
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const privilegedUsers = allUsers.filter(
      (u) =>
        u.role === 'admin' ||
        u.role === 'editor' ||
        u.email === 'admin@findora.com' ||
        u.email === 'editor@findora.com' ||
        u.email === 'aryasingh2366@gmail.com'
    );

    // 2. Fetch security events
    let securityEvents: any[] = [];
    try {
      const secQ = query(
        collection(db, 'securityEvents'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const secSnap = await getDocs(secQ);
      securityEvents = secSnap.docs.map((d) => d.data());
    } catch (e) {
      console.warn('Could not fetch securityEvents directly:', e);
    }

    // 3. Assemble login history
    const records: AdminLoginHistoryRecord[] = privilegedUsers.map((u) => {
      const userSecEvents = securityEvents.filter(
        (ev) => ev.userId === u.id && ev.eventType === 'login'
      );

      const recentSessions = userSecEvents.slice(0, 5).map((ev) => ({
        id: ev.id,
        timestamp: ev.timestamp,
        method: ev.details?.method || 'session',
      }));

      const lastLogin =
        userSecEvents[0]?.timestamp || u.lastLogin || u.createdAt || new Date().toISOString();

      return {
        userId: u.id,
        email: u.email || 'unknown@findora.com',
        name: u.name || (u.email ? u.email.split('@')[0] : 'Admin User'),
        role: (u.role === 'editor' ? 'editor' : 'admin') as 'admin' | 'editor',
        lastLogin,
        loginCount: Math.max(userSecEvents.length, 1),
        recentSessions,
      };
    });

    return records;
  } catch (e) {
    console.error('Error in fetchAdminLoginHistory:', e);
    return [];
  }
}
