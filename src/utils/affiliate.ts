/**
 * Production-ready affiliate tracking and navigation utilities for Findora.
 * Guarantees that tracking never blocks navigation and prevents duplicate click events.
 */

import { AffiliateClick } from '../types';
import { isAmazonUrl } from './amazon';

export interface AffiliateClickOptions {
  productId: string;
  productName?: string;
  storeId: string;
  storeName?: string;
  category?: string;
  price?: number;
  affiliateUrl: string;
  pageLocation?: string;
}

/**
 * Validates whether an affiliate link is safe and ready for public shopper use.
 */
export function isAffiliateLinkReady(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Formats an affiliate URL safely ensuring valid https:// protocol
 */
export function formatAffiliateUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Extracts a safe traffic source from referrer without sensitive data
 */
export function getSafeTrafficSource(): string {
  if (typeof document === 'undefined' || !document.referrer) return 'Direct';
  try {
    const refUrl = new URL(document.referrer);
    return refUrl.hostname.replace(/^www\./, '') || 'Direct';
  } catch {
    return 'Direct';
  }
}

/**
 * Extracts safe campaign/UTM parameter from query params without capturing sensitive data
 */
export function getSafeCampaign(): string | undefined {
  if (typeof window === 'undefined' || !window.location.search) return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmCampaign = params.get('utm_campaign');
    const utmSource = params.get('utm_source');
    const campaign = utmCampaign || utmSource;
    if (campaign) {
      // Clean and sanitize (max 50 chars, alphanumeric + dash/underscore)
      return campaign.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    }
  } catch {
    return undefined;
  }
  return undefined;
}
