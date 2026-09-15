import { OfferAvailability } from '../../types';

export interface NormalizedProductResponse {
  title?: string;
  brand?: string;
  category?: string;
  images?: string[];
  merchantProductId?: string;
  currentPrice?: number;
  mrp?: number;
  availability?: OfferAvailability;
  productUrl?: string;
  metadata?: Record<string, string>;
  error?: string;
}

export interface MerchantProvider {
  id: string;
  name: string;
  matchDomain(url: string): boolean;
  extractProductId(url: string): string | null;
  fetchProduct(url: string): Promise<NormalizedProductResponse>;
}
