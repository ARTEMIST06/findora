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
    // 2026-11-15 merges (aliases only — stored data untouched):
    // "Kitchen" (9) + "Kitchen Appliances" + "Home appliances" (1) all fold
    // into "Home & Kitchen", and "Bagpacks" (3) into "Bags & Luggage".
    // Round 2 (live check 2026-11-15 19:12 IST): the splinter groups the
    // first pass missed fold in too — "Kitchen & Home Appliances" (6),
    // "Small Kitchen Appliances" (1), "Kitchen items" (1) into Home &
    // Kitchen; "Bags, Wallets and Luggage" (5), "Bags" (3), "Luggage" (1),
    // "Luggage and travel" (2), "Handbags, Purses & Clutches" (1) into
    // Bags & Luggage.
    // Bare "home" (3) is deliberately NOT aliased: those products come from
    // the original AI Studio seed catalogue, are not identifiable from the
    // repo/workspace files, and "home" is genuinely ambiguous (decor?
    // appliances? general home goods?) — guessing would misfile them.
    kitchen: 'homekitchen',
    kitchenappliances: 'homekitchen',
    homeappliances: 'homekitchen',
    kitchenhomeappliances: 'homekitchen',
    smallkitchenappliances: 'homekitchen',
    kitchenitems: 'homekitchen',
    bagpacks: 'bagsluggage',
    bagswalletsandluggage: 'bagsluggage',
    bags: 'bagsluggage',
    luggage: 'bagsluggage',
    luggageandtravel: 'bagsluggage',
    handbagspursesclutches: 'bagsluggage',
    tws: 'earbuds',
    earphones: 'earbuds',
    truewirelessearbuds: 'earbuds',
    mobiles: 'smartphones',
    cellphones: 'smartphones',
    homedecor: 'homedecor',
    homedecoration: 'homedecor',
    homedcor: 'homedecor', // "Home & Décor" — é is stripped by normalisation
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

/**
 * Display name for a product's raw category, using the merged group's
 * canonical name where one exists (so a card never shows a splinter label
 * like "Bagpacks" while the category page says "Bags & Luggage").
 * Anything unmerged falls back to the cleaned raw string.
 */
const CANONICAL_CATEGORY_NAMES: Record<string, string> = {
  homekitchen: 'Home & Kitchen',
  bagsluggage: 'Bags & Luggage',
  homedecor: 'Home Decor',
};

export function displayCategoryName(raw: string): string {
  const key = normalizeCategoryKey(cleanCategoryLabel(raw || 'General'));
  return CANONICAL_CATEGORY_NAMES[key] || cleanCategoryLabel(raw || 'General');
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

export interface AdminCategoryOption {
  /** Exact string written back to product.category on save. */
  value: string;
  /** What the admin sees in the dropdown. */
  label: string;
}

/**
 * Options for the Admin Edit Product category dropdown.
 *
 * BUG IT FIXES (2026-11-16): the dialog used to offer only the 8 hardcoded
 * mock categories from mockData.ts, whose option values are slugs. A stored
 * category like "Home & Kitchen" matched NO option, so saving a non-tech
 * product silently overwrote its category (proven live: a "Home & Kitchen"
 * desk lamp came back as "cameras"). The `categories` Firestore collection
 * is empty, so there is no registry to fall back on — the live catalogue
 * itself is the source of truth.
 *
 * Guarantees:
 * - Every canonical category derived from the live catalogue is offered
 *   (value = the group's display name, the exact string stored on most of
 *   its products).
 * - Every distinct stored category string gets its own option, including
 *   legacy slugs ("cameras", "home", "shoes") and typos — so picking any
 *   option writes back the same string the product already has.
 * - The product being edited always appears, even if its value matches
 *   nothing else (e.g. just fetched from Amazon) — saving can never
 *   silently change a category.
 */
export function buildAdminCategoryOptions<T extends { category: string }>(
  products: T[],
  currentValue?: string | null
): AdminCategoryOption[] {
  const options: AdminCategoryOption[] = [];
  const seen = new Set<string>();

  // Canonical groups, as derived by deriveCategories (same grouping, same
  // order — biggest first). The option VALUE is the group's most common
  // EXACT stored string, not the cleaned group name: the two differ when a
  // stored spelling has odd whitespace (e.g. "Sleep &  Relaxation"), and
  // the exact spelling must be the value so a save writes it back unchanged.
  const derived = deriveCategories(products);
  for (const d of derived) {
    let best = '';
    let bestCount = 0;
    const counts = new Map<string, number>();
    for (const p of products) {
      const raw = p.category || 'General';
      if (normalizeCategoryKey(cleanCategoryLabel(raw)) !== d.key) continue;
      const n = (counts.get(raw) || 0) + 1;
      counts.set(raw, n);
      if (n > bestCount) {
        bestCount = n;
        best = raw;
      }
    }
    const value = best || d.name;
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({ value, label: `${value} (${d.count})` });
  }

  // Distinct stored strings that are NOT a canonical group name still get
  // their own option, so their exact spelling round-trips through a save.
  // Values are used EXACTLY as stored (no whitespace cleanup): even a
  // double space inside a stored string ("Sleep &  Relaxation") must be
  // selectable as-is, or saving would silently rewrite it.
  const rawCounts = new Map<string, number>();
  for (const p of products) {
    const raw = p.category || 'General';
    rawCounts.set(raw, (rawCounts.get(raw) || 0) + 1);
  }
  const extras = [...rawCounts.entries()]
    .filter(([raw]) => !seen.has(raw))
    .sort((a, b) => a[0].localeCompare(b[0]));
  for (const [raw, count] of extras) {
    seen.add(raw);
    options.push({ value: raw, label: `${raw} (${count})` });
  }

  // The product being edited: never lose its value, even if it came from
  // outside the catalogue (e.g. a fresh Amazon fetch). Used exactly as
  // stored — not trimmed or cleaned — so a save writes it back unchanged.
  const current = currentValue || '';
  if (current.trim() && !seen.has(current)) {
    seen.add(current);
    options.push({ value: current, label: `${current} (current)` });
  }

  return options;
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
    homekitchen: '#10B981',
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
