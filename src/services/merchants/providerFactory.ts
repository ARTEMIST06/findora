import { MerchantProvider } from './types';

// Stub for now, can be expanded to integrate with real backend APIs
class AmazonProvider implements MerchantProvider {
  id = 'amazon';
  name = 'Amazon';

  matchDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes('amazon.in') || hostname.includes('amazon.com');
    } catch {
      return false;
    }
  }

  extractProductId(url: string): string | null {
    try {
      const match = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async fetchProduct(url: string) {
    // We do NOT implement fragile web scraping. 
    // In production, this would call our secure backend which calls an official API/Feed.
    return {
      error: "Automatic data fetching isn't available for this merchant yet."
    };
  }
}

class FlipkartProvider implements MerchantProvider {
  id = 'flipkart';
  name = 'Flipkart';

  matchDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes('flipkart.com');
    } catch {
      return false;
    }
  }

  extractProductId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('pid') || null;
    } catch {
      return null;
    }
  }

  async fetchProduct(url: string) {
    return {
      error: "Automatic data fetching isn't available for this merchant yet."
    };
  }
}

class CromaProvider implements MerchantProvider {
  id = 'croma';
  name = 'Croma';

  matchDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes('croma.com');
    } catch {
      return false;
    }
  }

  extractProductId(url: string): string | null {
    try {
      const match = url.match(/\/p\/(\d+)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async fetchProduct(url: string) {
    return {
      error: "Automatic data fetching isn't available for this merchant yet."
    };
  }
}

const providers: MerchantProvider[] = [
  new AmazonProvider(),
  new FlipkartProvider(),
  new CromaProvider(),
];

export const getProviderForUrl = (url: string): MerchantProvider | null => {
  return providers.find(p => p.matchDomain(url)) || null;
};

export const getProviderById = (id: string): MerchantProvider | null => {
  return providers.find(p => p.id === id) || null;
};

export const getAllProviders = () => providers;
