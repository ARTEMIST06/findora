/**
 * Findora canonical category helpers.
 *
 * The catalogue's `product.category` is a free-text string from the original
 * AI Studio import ("Fashion", "Home & Kitchen", "Large Appiliances", ...),
 * while the Admin taxonomy uses slugs ("fashion", "home-kitchen", ...).
 * Exact string equality therefore missed most products — category counts
 * showed 0 for categories that had products, and /category/:slug pages came
 * up empty. Every public surface (counts, filters, pills, links) goes
 * through these helpers so they always agree.
 *
 * Rule: never invent a category. The public taxonomy is DERIVED from the
 * products that actually exist — if a category has no published products,
 * it does not appear.
 */

/** Lowercase + strip every separator, with typo fixes from the imported data. */
export function normalizeCategoryKey(value: string | undefined | null): string {
  if (!value) return '';
  let key = value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  // Known typos / variants in the imported catalogue data.
  const aliases: Record<string, string> = {
    largeappiliances: 'largeappliances',
    appiliances: 'appliances',
    kitchenappliances: 'kitchen',
    tws: 'earbuds',
    earphones: 'earbuds',
    truewirelessearbuds: 'earbuds',
    mobiles: 'smartphones',
    cellphones: 'smartphones',
    homedecor: 'homedecor',
    homedecoration: 'homedecor',
    homeandkitchen: 'homekitchen',
    headphonesearbudsaccessorie: 'headphonesearbudsaccessories',
    decorativeaccessorie: 'decorativeaccessories',
  };
  return aliases[key] || key;
}

/** "Home & Kitchen" -> "home-kitchen" (URL-safe slug).
 * NOTE: "&" is DROPPED, not turned into "and" — the matcher
 * (normalizeCategoryKey) strips "&" entirely, so a slug with "and" in it
 * would never match its products (this silently broke every "&" category
 * link: Home & Kitchen, Bath & Body, Health & Personal Care...). */
export function slugifyCategoryLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Clean a raw category string for display: trim, collapse spaces, keep case. */
export function cleanCategoryLabel(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** "home-kitchen" -> "Home Kitchen" (fallback display name for a bare slug). */
export function prettifySlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface DerivedCategory {
  /** Normalised key used for matching, e.g. "homekitchen". */
  key: string;
  /** URL slug, e.g. "home-kitchen". */
  slug: string;
  /** Display name, e.g. "Home & Kitchen". */
  name: string;
  /** Number of products in this category. */
  count: number;
  /** Brands present, most common first (max 5). */
  brands: string[];
}

/**
 * Build the public taxonomy from the products that actually exist.
 * Groups by normalised key, names each group after its most common raw
 * category string, and sorts by product count (biggest first).
 */
export function deriveCategories<T extends { category: string; brand?: string }>(
  products: T[]
): DerivedCategory[] {
  const groups = new Map<
    string,
    { rawCounts: Map<string, number>; count: number; brands: Map<string, number> }
  >();
  for (const p of products) {
    const raw = cleanCategoryLabel(p.category || 'General');
    const key = normalizeCategoryKey(raw) || 'general';
    let g = groups.get(key);
    if (!g) {
      g = { rawCounts: new Map(), count: 0, brands: new Map() };
      groups.set(key, g);
    }
    g.count += 1;
    g.rawCounts.set(raw, (g.rawCounts.get(raw) || 0) + 1);
    if (p.brand) g.brands.set(p.brand, (g.brands.get(p.brand) || 0) + 1);
  }
  return [...groups.entries()]
    .map(([key, g]) => {
      const name = [...g.rawCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return {
        key,
        slug: slugifyCategoryLabel(name),
        name,
        count: g.count,
        brands: [...g.brands.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([b]) => b),
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** Does this product belong to the category identified by a slug or key? */
export function productMatchesCategory(
  productCategory: string | undefined | null,
  slugOrKey: string
): boolean {
  return normalizeCategoryKey(productCategory) === normalizeCategoryKey(slugOrKey);
}

/** Display name for a category slug, from the live products if possible. */
export function categoryNameForSlug<T extends { category: string }>(
  products: T[],
  slug: string
): string {
  const derived = deriveCategories(products);
  const hit = derived.find((d) => d.slug === slug || d.key === normalizeCategoryKey(slug));
  return hit ? hit.name : prettifySlug(slug);
}

/** Stable accent colour per category key (for tiles, icons, chips). */
export function categoryAccent(key: string): string {
  const accents: Record<string, string> = {
    earbuds: '#8B5CF6',
    audio: '#8B5CF6',
    headphones: '#8B5CF6',
    smartphones: '#3B82F6',
    smartwatches: '#EC4899',
    watches: '#F59E0B',
    laptops: '#6366F1',
    laptopaccessories: '#6366F1',
    mobileaccessories: '#3B82F6',
    powerbanks: '#F59E0B',
    kitchen: '#10B981',
    homeappliances: '#14B8A6',
    largeappliances: '#14B8A6',
    appliances: '#14B8A6',
    fashion: '#F43F5E',
    footwear: '#F97316',
    beauty: '#EC4899',
    jewellery: '#EAB308',
    jewelry: '#EAB308',
    homedecor: '#A855F7',
    gardening: '#22C55E',
    home: '#14B8A6',
    fitness: '#22C55E',
    bags: '#F97316',
    travel: '#0284C7',
    cameras: '#F59E0B',
  };
  return accents[normalizeCategoryKey(key)] || '#3B82F6';
}
