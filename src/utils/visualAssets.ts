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
  'home-decor': {
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    alt: 'Home decor and interiors',
    accent: '#A855F7',
  },
  watches: {
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&auto=format&fit=crop&q=80',
    alt: 'Watches for men and women',
    accent: '#F59E0B',
  },
  earbuds: {
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    alt: 'True wireless earbuds',
    accent: '#8B5CF6',
  },
  footwear: {
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    alt: 'Sneakers and footwear',
    accent: '#F97316',
  },
  jewellery: {
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
    alt: 'Jewellery and pendants',
    accent: '#EAB308',
  },
  appliances: {
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80',
    alt: 'Home and kitchen appliances',
    accent: '#14B8A6',
  },
  powerbanks: {
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
    alt: 'Power banks and charging',
    accent: '#F59E0B',
  },
  'laptop-accessories': {
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
    alt: 'Laptop stands, cooling pads and accessories',
    accent: '#6366F1',
  },
  'mobile-accessories': {
    image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    alt: 'Mobile accessories',
    accent: '#3B82F6',
  },
  bags: {
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
    alt: 'Bags, backpacks and luggage',
    accent: '#F97316',
  },
  auto: {
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    alt: 'Automotive electronics and accessories',
    accent: '#64748B',
  },
  // Aliases for the top live catalogue categories (derived slugs) — they
  // reuse the matching photo above so category tiles and the homepage
  // showcase never fall back to a bare icon for a big category.
  shoes: {
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    alt: 'Sneakers and footwear',
    accent: '#F97316',
  },
  apparels: {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
    alt: 'Curated fashion and apparel',
    accent: '#F43F5E',
  },
  'home-kitchen': {
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    alt: 'Smart kitchen and culinary appliances',
    accent: '#10B981',
  },
  'kitchen-home-appliances': {
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    alt: 'Smart kitchen and culinary appliances',
    accent: '#10B981',
  },
  'large-appliances': {
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80',
    alt: 'Home and kitchen appliances',
    accent: '#14B8A6',
  },
  accessories: {
    image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    alt: 'Mobile accessories',
    accent: '#3B82F6',
  },
  'clothing-accessories': {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
    alt: 'Curated fashion and apparel',
    accent: '#F43F5E',
  },
  cookware: {
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    alt: 'Smart kitchen and culinary appliances',
    accent: '#10B981',
  },
};

// Curated Editorial Banners
export const EDITORIAL_ASSETS = {
  topDeals: {
    title: 'Top Deals. Bigger Savings.',
    tagline: 'BIGGEST DISCOUNTS VS MRP',
    description: 'Biggest discounts vs MRP on Amazon India — see the price and the date it was last verified before you buy.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    cta: 'Explore Daily Deals',
    targetRoute: '/deals',
  },
  setup: {
    title: 'Smart Picks For Your Setup',
    tagline: 'CURATED DESK WORKSPACE',
    description: 'Study tables, desks and workspace furniture that make a study desk actually comfortable.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&auto=format&fit=crop&q=80',
    cta: 'Shop Setup Essentials',
    // Was '/category/laptop-accessories' — that category has ZERO published
    // products (the laptop stands/keyboards are unpublished drafts), so the
    // banner led to an empty page. Study & Home Office Furniture is live.
    targetRoute: '/category/study-home-office-furniture',
  },
  everyday: {
    title: 'Upgrade Your Everyday',
    tagline: 'SMART LIVING & HOME',
    description: 'Air fryers, vacuums, kettles and home essentials that make everyday living easier.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
    cta: 'Explore Home Tech',
    // Was '/category/home-appliances' — only 1 product lives there.
    // Kitchen & Home Appliances is the real, populated home-tech shelf.
    targetRoute: '/category/kitchen-home-appliances',
  },
  trending: {
    title: "Discover What's Trending",
    tagline: 'MOST CLICKED NOW',
    description: 'The products shoppers are clicking on most right now — earbuds, watches, kitchen picks and more.',
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
