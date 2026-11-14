/**
 * Findora Centralized Visual Asset Resolver & Registry
 * 
 * Hierarchy:
 * 1. Real product image from Firestore
 * 2. Existing approved image
 * 3. Category-specific image
 * 4. Curated local asset
 * 5. Generated visual asset
 * 6. Elegant gradient/visual fallback
 */

import React from 'react';
import { ProductWithPrices, Product } from '../types';

export interface VisualAssetOptions {
  type: 'hero' | 'category' | 'product_fallback' | 'editorial' | 'brand' | 'store';
  category?: string;
  product?: Partial<Product | ProductWithPrices>;
  section?: 'hero' | 'deals' | 'setup' | 'lifestyle' | 'trending' | 'comparison';
  variant?: 'banner' | 'card' | 'thumbnail' | 'square' | 'wide';
}

// Curated Category Images (Dark cinematic, tech/lifestyle focused, consistent with Findora's palette)
export const CATEGORY_ASSETS: Record<string, { image: string; alt: string; accent: string }> = {
  smartphones: {
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
    alt: 'Premium 5G flagship smartphones',
    accent: '#3B82F6',
  },
  laptops: {
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    alt: 'MacBooks and performance laptops',
    accent: '#6366F1',
  },
  audio: {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    alt: 'Studio headphones and wireless audio',
    accent: '#8B5CF6',
  },
  smartwatches: {
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
    alt: 'Smartwatches and fitness wearables',
    accent: '#EC4899',
  },
  televisions: {
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
    alt: '4K OLED & Smart TV displays',
    accent: '#06B6D4',
  },
  tablets: {
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
    alt: 'iPads and creative tablets',
    accent: '#3B82F6',
  },
  gaming: {
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80',
    alt: 'Next-gen gaming consoles and setups',
    accent: '#A855F7',
  },
  cameras: {
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    alt: 'Mirrorless cameras and vlogging gear',
    accent: '#F59E0B',
  },
  kitchen: {
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    alt: 'Smart kitchen and culinary appliances',
    accent: '#10B981',
  },
  'home-appliances': {
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    alt: 'Smart home interior and appliances',
    accent: '#14B8A6',
  },
  fashion: {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
    alt: 'Curated fashion and apparel',
    accent: '#F43F5E',
  },
  beauty: {
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
    alt: 'Skincare and beauty essentials',
    accent: '#EC4899',
  },
  travel: {
    image: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&auto=format&fit=crop&q=80',
    alt: 'Premium luggage and travel bags',
    accent: '#0284C7',
  },
  books: {
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    alt: 'Books and digital reading',
    accent: '#D97706',
  },
  auto: {
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    alt: 'Automotive electronics and accessories',
    accent: '#64748B',
  },
};

// Curated Editorial Banners
export const EDITORIAL_ASSETS = {
  topDeals: {
    title: 'Top Deals. Bigger Savings.',
    tagline: 'VERIFIED PRICE DROPS',
    description: 'Verified Amazon India price drops, checked by our team — see the price and the date it was last verified before stock runs out.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    cta: 'Explore Daily Deals',
    targetRoute: '/deals',
  },
  setup: {
    title: 'Smart Picks For Your Setup',
    tagline: 'CURATED DESK WORKSPACE',
    description: 'Elevate your daily workstation with color-accurate displays, mechanical switches, and studio audio.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&auto=format&fit=crop&q=80',
    cta: 'Shop Setup Essentials',
    targetRoute: '/category/laptops',
  },
  everyday: {
    title: 'Upgrade Your Everyday',
    tagline: 'SMART LIVING & HOME',
    description: 'Robotic vacuums, air fryers, and smart climate controls designed to save hours of routine effort.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
    cta: 'Explore Home Tech',
    targetRoute: '/category/home-appliances',
  },
  trending: {
    title: "Discover What's Trending",
    tagline: 'COMMUNITY TOP-RATED',
    description: 'Flagships, foldables, and wearable trackers with verified ratings above 4.5 stars.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    cta: 'View Trending Gear',
    targetRoute: '/products',
  },
};

// Hero Cinematic Tech Composition
export const HERO_VISUAL = {
  primary: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=85',
  alt: 'Cinematic technology showcase: laptop, smartphone, audio, and smart gear in navy ambient lighting',
};

// Default fallback image if nothing else matches
export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';

/**
 * Resolves the visual asset based on contextual priority.
 */
export function getVisualAsset(options: VisualAssetOptions): string {
  const { type, category, product, section } = options;

  // 1. Real product image from Firestore if available
  if (type === 'product_fallback' && product?.images && product.images.length > 0) {
    return product.images[0];
  }

  // 2. Editorial sections
  if (type === 'editorial') {
    if (section === 'deals') return EDITORIAL_ASSETS.topDeals.image;
    if (section === 'setup') return EDITORIAL_ASSETS.setup.image;
    if (section === 'lifestyle') return EDITORIAL_ASSETS.everyday.image;
    if (section === 'trending') return EDITORIAL_ASSETS.trending.image;
    return EDITORIAL_ASSETS.topDeals.image;
  }

  // 3. Hero asset
  if (type === 'hero') {
    return HERO_VISUAL.primary;
  }

  // 4. Category-specific asset
  if (category) {
    const normalizedCat = category.toLowerCase().trim();
    if (CATEGORY_ASSETS[normalizedCat]) {
      return CATEGORY_ASSETS[normalizedCat].image;
    }
    // Check partial slug matching
    const matchingKey = Object.keys(CATEGORY_ASSETS).find((key) =>
      normalizedCat.includes(key) || key.includes(normalizedCat)
    );
    if (matchingKey) {
      return CATEGORY_ASSETS[matchingKey].image;
    }
  }

  // 5. Product category fallback
  if (product?.category) {
    const cat = product.category.toLowerCase().trim();
    if (CATEGORY_ASSETS[cat]) {
      return CATEGORY_ASSETS[cat].image;
    }
  }

  // 6. Default fallback
  return DEFAULT_FALLBACK_IMAGE;
}

/**
 * Returns primary product image with robust category-aware fallback.
 */
export function getProductImage(
  product?: Partial<Product | ProductWithPrices> | null,
  fallbackCategory?: string
): string {
  if (product?.images && product.images.length > 0 && product.images[0].trim() !== '') {
    return product.images[0];
  }
  const targetCategory = product?.category || fallbackCategory;
  if (targetCategory && CATEGORY_ASSETS[targetCategory.toLowerCase()]) {
    return CATEGORY_ASSETS[targetCategory.toLowerCase()].image;
  }
  return DEFAULT_FALLBACK_IMAGE;
}

/**
 * Safe image onError handler: gracefully swaps broken image URL to designed category fallback
 */
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
) {
  const target = event.currentTarget;
  const fallback = category && CATEGORY_ASSETS[category.toLowerCase()]
    ? CATEGORY_ASSETS[category.toLowerCase()].image
    : DEFAULT_FALLBACK_IMAGE;

  // Prevent infinite error loop if fallback itself has issues
  if (target.src !== fallback) {
    target.onerror = null;
    target.src = fallback;
  }
}
