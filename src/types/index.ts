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
  fetchProvider?: string;
  syncSupported?: boolean;
}

export type OfferAvailability = 'in_stock' | 'out_of_stock' | 'pre_order' | 'limited_stock';
export type OfferSourceType = 'manual' | 'api' | 'feed' | 'import';

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
  merchantProductId?: string;
  productUrl?: string;
  syncStatus?: 'manual' | 'automatic' | 'error' | 'unavailable';
  syncError?: string;
  lastSyncedAt?: string;
  priceDrop?: {
    amount: number;
    percentage: number;
    previousPrice: number;
    detectedAt: string;
  };
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

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

export interface ProductDraft {
  id: string;
  draftStatus?: 'incomplete' | 'in_progress' | 'almost_ready' | 'ready_to_publish' | 'published';
  title: string;
  brand: string;
  category: string;
  productUrl: string;
  affiliateUrl: string;
  merchantId: string;
  merchantProductId: string;
  image: string;
  currentPrice: number | null;
  mrp: number | null;
  availability: OfferAvailability;
  badge: string;
  shortPitch: string;
  whyFindora: string;
  pros: string[];
  cons: string[];
  specifications: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  published: boolean;
  featured: boolean;
  addedBy: 'Arya' | 'Ananya' | 'Khushi' | string;
  addedByUserId: string;
  manualEdits?: Record<string, boolean>;
  lastGeneratedHash?: string;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
  amazonNeedsVerification?: boolean;
  duplicatedFromId?: string;
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


export interface ImportHistory {
  id: string;
  fileName: string;
  importedBy: string;
  importedAt: string;
  totalRows: number;
  imported: number;
  needsReview: number;
  skipped: number;
  failed: number;
}

export interface PriceHistory {
  id: string;
  productId: string;
  offerId: string;
  merchantId: string;
  price: number;
  mrp?: number;
  availability: OfferAvailability;
  recordedAt: string;
  source: OfferSourceType;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  offerId: string;
  targetPrice: number;
  currency: string;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}
