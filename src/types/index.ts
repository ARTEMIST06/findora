export type UserRole = 'admin' | 'editor' | 'shopper';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  website: string;
  websiteUrl?: string;
  affiliateNetwork?: string;
  affiliateTag?: string;
  affiliateParamKey?: string;
  defaultAffiliateTag?: string;
  isActive: boolean;
  active?: boolean;
  color?: string;
}

export type OfferAvailability = 'in_stock' | 'out_of_stock' | 'pre_order' | 'limited_stock';
export type OfferSourceType = 'manual' | 'api' | 'feed';

export interface PriceOffer {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  originalPrice?: number;
  currency: string;
  affiliateUrl: string;
  availability: OfferAvailability;
  lastUpdated: string;
  sourceType: OfferSourceType;
  couponCode?: string;
  shippingNote?: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  storeId: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  specifications: Record<string, string>;
  pros: string[];
  cons: string[];
  whyFindora: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  badge?: string; // e.g. "Editor's Choice", "Best Value", "Flagship Pick"
  createdAt: string;
  lastLogin?: string;
  updatedAt: string;
}

export interface AffiliateClick {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  price: number;
  affiliateUrl: string;
  timestamp: string;
  userId?: string;
  referrer?: string;
  device?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  itemCount?: number;
  popularBrands: string[];
}

export interface ProductWithPrices extends Product {
  offers: PriceOffer[];
  lowestPrice?: number;
  highestPrice?: number;
  maxDiscountPercent?: number;
  bestStore?: Store;
}
