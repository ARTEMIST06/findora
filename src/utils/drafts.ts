import { ProductDraft } from '../types';

export const REQUIRED_DRAFT_FIELDS = [
  { key: 'title', label: 'Product Title' },
  { key: 'brand', label: 'Brand' },
  { key: 'category', label: 'Category' },
  { key: 'merchantId', label: 'Merchant' },
  { key: 'productUrl', label: 'Product URL' },
  { key: 'image', label: 'Image URL' },
  { key: 'currentPrice', label: 'Current Price' },
  { key: 'availability', label: 'Availability' },
  { key: 'affiliateUrl', label: 'Affiliate URL' },
];

export function getMissingDraftFields(draft: Partial<ProductDraft>) {
  return REQUIRED_DRAFT_FIELDS.filter(f => {
    const val = (draft as any)[f.key];
    return val === null || val === undefined || val === '';
  });
}

export function calculateDraftStatus(draft: Partial<ProductDraft>): 'incomplete' | 'in_progress' | 'almost_ready' | 'ready_to_publish' | 'published' {
  if (draft.published) return 'published';
  const missing = getMissingDraftFields(draft);
  const completion = Math.round(((REQUIRED_DRAFT_FIELDS.length - missing.length) / REQUIRED_DRAFT_FIELDS.length) * 100);
  
  if (completion === 100) return 'ready_to_publish';
  if (completion >= 70) return 'almost_ready';
  if (completion >= 40) return 'in_progress';
  return 'incomplete';
}

export function formatDraftStatus(status: string) {
  switch (status) {
    case 'incomplete': return 'Incomplete';
    case 'in_progress': return 'In Progress';
    case 'almost_ready': return 'Almost Ready';
    case 'ready_to_publish': return 'Ready to Publish';
    case 'published': return 'Published';
    default: return 'Unknown';
  }
}
