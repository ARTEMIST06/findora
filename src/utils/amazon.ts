/**
 * Amazon URL and Affiliate validation utilities for Findora CMS.
 */

export function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Checks whether a given hostname belongs to legitimate Amazon infrastructure
 * including branded TLD (.amazon / link.amazon), official shorteners (amzn.to, amzn.in, a.co),
 * and standard international Amazon domains (*.amazon.in, *.amazon.com, etc.).
 * Strictly prevents lookalikes like amazon.in.evil.com, evil-amazon.in, amazon.fake.com.
 */
export function isAmazonHostname(hostname: string | null | undefined): boolean {
  if (!hostname || typeof hostname !== 'string') return false;
  const host = hostname.toLowerCase();

  // 1. Amazon-owned branded top-level domain (.amazon) and link.amazon short links
  if (host === 'link.amazon' || host.endsWith('.link.amazon') || host === 'amazon' || host.endsWith('.amazon')) {
    return true;
  }

  // 2. Official Amazon short links
  if (
    host === 'amzn.to' || host.endsWith('.amzn.to') ||
    host === 'amzn.in' || host.endsWith('.amzn.in') ||
    host === 'a.co' || host.endsWith('.a.co')
  ) {
    return true;
  }

  // 3. Legitimate Amazon web domains (e.g. amazon.in, www.amazon.in, amazon.com, www.amazon.com)
  // Must end strictly with .amazon.<tld> or equal amazon.<tld>
  const amazonDomainRegex = /^(?:[a-z0-9-]+\.)*amazon\.(?:in|com|co\.uk|co\.jp|com\.au|com\.br|com\.mx|de|fr|es|it|ca|nl|se|pl|ae|sa|sg|be|eg|co\.za|com\.tr)$/;
  return amazonDomainRegex.test(host);
}

export function isAmazonUrl(url: string | null | undefined): boolean {
  if (!isValidHttpUrl(url)) return false;
  try {
    const parsed = new URL(url!.trim());
    return isAmazonHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function validateAmazonAffiliateUrl(url: string | null | undefined): {
  isValid: boolean;
  isAmazon: boolean;
  message: string;
} {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      isAmazon: false,
      message: 'Affiliate URL is required before publishing.',
    };
  }

  const trimmed = url.trim();
  // Only accept HTTPS URLs for affiliate links (reject http://, javascript:, data:, blob:, etc.)
  if (!trimmed.startsWith('https://')) {
    return {
      isValid: false,
      isAmazon: false,
      message: 'Enter a valid Amazon Associates link.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      isAmazon: false,
      message: 'Invalid URL format.',
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      isValid: false,
      isAmazon: false,
      message: 'Enter a valid Amazon Associates link.',
    };
  }

  if (!isAmazonHostname(parsed.hostname)) {
    return {
      isValid: false,
      isAmazon: false,
      message: 'Enter a valid Amazon Associates link.',
    };
  }

  return {
    isValid: true,
    isAmazon: true,
    message: 'Valid Amazon affiliate link',
  };
}

export function getAmazonProductUrl(item: any): string | null {
  if (!item) return null;

  // Direct productUrl on draft or offer
  if (item.productUrl && typeof item.productUrl === 'string' && isValidHttpUrl(item.productUrl)) {
    return item.productUrl.trim();
  }

  // If item has offers array (ProductWithPrices)
  if (Array.isArray(item.offers) && item.offers.length > 0) {
    const amazonOffer = item.offers.find(
      (o: any) =>
        o.storeId === 'store-amazon' ||
        isAmazonUrl(o.productUrl) ||
        isAmazonUrl(o.affiliateUrl)
    );
    if (amazonOffer && amazonOffer.productUrl && isValidHttpUrl(amazonOffer.productUrl)) {
      return amazonOffer.productUrl.trim();
    }
  }

  return null;
}

export function getAmazonAffiliateUrl(item: any): string | null {
  if (!item) return null;

  // Direct affiliateUrl on draft or offer
  if (item.affiliateUrl && typeof item.affiliateUrl === 'string' && isValidHttpUrl(item.affiliateUrl)) {
    return item.affiliateUrl.trim();
  }

  // If item has offers array (ProductWithPrices)
  if (Array.isArray(item.offers) && item.offers.length > 0) {
    const amazonOffer = item.offers.find(
      (o: any) =>
        o.storeId === 'store-amazon' ||
        isAmazonUrl(o.affiliateUrl) ||
        isAmazonUrl(o.productUrl)
    );
    if (amazonOffer && amazonOffer.affiliateUrl && isValidHttpUrl(amazonOffer.affiliateUrl)) {
      return amazonOffer.affiliateUrl.trim();
    }
  }

  return null;
}
