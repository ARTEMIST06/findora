// Word-level product search.
//
// The old filter matched the whole query as one contiguous substring, so a
// perfectly good query like "Solimo Planter" returned 0 results — the
// product is titled "Solimo Flower Planter ...", where the two words are
// not adjacent. A query now matches when the exact phrase appears OR when
// every word of the query appears somewhere in the haystack (name, brand,
// category, tags). Relevance ranks exact-phrase matches first.
export function matchesSearchQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = haystack.toLowerCase();
  if (hay.includes(q)) return true;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return false;
  return words.every((w) => hay.includes(w));
}

export function searchRelevance(haystack: string, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const hay = haystack.toLowerCase();
  if (hay.includes(q)) return 3;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 0 && hay.startsWith(words[0])) return 2;
  return 1;
}

export function productSearchHaystack(p: {
  name?: string;
  brand?: string;
  category?: string;
  tags?: string[];
}): string {
  return [p.name || '', p.brand || '', p.category || '', (p.tags || []).join(' ')].join(' ');
}
