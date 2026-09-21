import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Eye,
  Check,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Image as ImageIcon,
  ImageOff,
  ShoppingBag,
  X,
  Activity,
  SlidersHorizontal,
  PackageSearch,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { Product, ProductWithPrices, ProductDraft, PriceOffer, Category, Brand, Store } from '../../types';
import { OpenAmazonButton } from './OpenAmazonButton';
import { AmazonQuickActions } from './AmazonQuickActions';

export type StatusTabType = 'all' | 'draft' | 'review' | 'published';

export interface UnifiedProductItem {
  id: string;
  isDraft: boolean;
  name: string;
  slug?: string;
  brand: string;
  category: string;
  image?: string;
  images: string[];
  status: 'published' | 'review' | 'draft';
  lowestPrice?: number;
  storesCount: number;
  offers: PriceOffer[];
  hasAffiliate: boolean;
  affiliateUrl?: string;
  productUrl?: string;
  hasImage: boolean;
  amazonNeedsVerification: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  rawProduct?: ProductWithPrices;
  rawDraft?: ProductDraft;
}

interface ProductManagementProps {
  products: ProductWithPrices[];
  drafts: ProductDraft[];
  categories: Category[];
  brands: Brand[];
  stores: Store[];
  onOpenNewProduct: () => void;
  onEditProduct: (prod: ProductWithPrices) => void;
  onDuplicateProduct: (prod: ProductWithPrices) => void;
  onDeleteProduct: (prodId: string, name: string) => void;
  onOpenAddOffer: (prodId: string) => void;
  onNavigate: (path: string) => void;
  onEditDraft?: (draftId: string) => void;
  onDuplicateDraft?: (draft: ProductDraft) => void;
  onDeleteDraft?: (draftId: string) => void;
  onExportExcel?: () => void;
  isExporting?: boolean;
}

const formatINR = (num?: number) => {
  if (num === undefined || num === null || isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  drafts,
  categories,
  brands,
  stores,
  onOpenNewProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onOpenAddOffer,
  onNavigate,
  onEditDraft,
  onDuplicateDraft,
  onDeleteDraft,
  onExportExcel,
  isExporting,
}) => {
  // --- Filter State ---
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedAffiliateStatus, setSelectedAffiliateStatus] = useState<'all' | 'with_affiliate' | 'missing_affiliate'>('all');
  const [selectedImageStatus, setSelectedImageStatus] = useState<'all' | 'with_image' | 'missing_image'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'recently_updated'>('newest');

  // Build unified items from products and drafts
  const unifiedItems = useMemo<UnifiedProductItem[]>(() => {
    const items: UnifiedProductItem[] = [];
    const seenProductNames = new Set<string>();

    // 1. Process standard products
    for (const prod of products) {
      const primaryOffer = prod.offers && prod.offers.length > 0 ? prod.offers[0] : undefined;
      const amazonOffer = prod.offers?.find((o) => o.storeId === 'store-amazon' || o.productUrl?.includes('amazon'));
      const affiliateUrl = amazonOffer?.affiliateUrl || primaryOffer?.affiliateUrl || '';
      const productUrl = amazonOffer?.productUrl || primaryOffer?.productUrl || '';

      const hasAffiliate = Boolean(affiliateUrl && affiliateUrl.trim().length > 0);
      const hasImage = Boolean(prod.images && prod.images.length > 0 && prod.images[0] && prod.images[0].trim().length > 0);
      const hasPrice = Boolean((prod.lowestPrice && prod.lowestPrice > 0) || (primaryOffer && primaryOffer.price && primaryOffer.price > 0));
      const needsAmazonVerification = Boolean(prod.amazonNeedsVerification);

      // Determine computed status:
      // Respect explicit fields or calculate from publish criteria
      let computedStatus: 'published' | 'review' | 'draft' = 'draft';
      const explicitDraftStatus = (prod as any).draftStatus;
      const explicitStatus = (prod as any).status;

      if (explicitStatus === 'published' || explicitDraftStatus === 'published' || prod.published) {
        computedStatus = 'published';
      } else if (explicitStatus === 'review' || explicitDraftStatus === 'ready_to_publish') {
        computedStatus = 'review';
      } else if (explicitStatus === 'draft' || explicitDraftStatus === 'incomplete' || explicitDraftStatus === 'in_progress' || explicitDraftStatus === 'almost_ready') {
        computedStatus = 'draft';
      } else {
        // Fallback calculation for unpublished products:
        // If it meets all publishing criteria and isn't blocked by amazon verification -> Ready for review!
        if (hasImage && hasPrice && hasAffiliate && !needsAmazonVerification) {
          computedStatus = 'review';
        } else {
          computedStatus = 'draft';
        }
      }

      const item: UnifiedProductItem = {
        id: prod.id,
        isDraft: false,
        name: prod.name || 'Untitled Product',
        slug: prod.slug,
        brand: prod.brand || 'Unbranded',
        category: prod.category || 'general',
        image: prod.images?.[0] || '',
        images: prod.images || [],
        status: computedStatus,
        lowestPrice: prod.lowestPrice || (primaryOffer ? primaryOffer.price : undefined),
        storesCount: prod.offers?.length || 0,
        offers: prod.offers || [],
        hasAffiliate,
        affiliateUrl,
        productUrl,
        hasImage,
        amazonNeedsVerification: needsAmazonVerification,
        createdAt: prod.createdAt || '',
        updatedAt: prod.updatedAt || prod.createdAt || '',
        tags: prod.tags || [],
        rawProduct: prod,
      };

      items.push(item);
      if (prod.name) {
        seenProductNames.add(prod.name.trim().toLowerCase());
      }
    }

    // 2. Process drafts (from Firestore productDrafts)
    // Only add drafts that are not already published canonical products
    for (const draft of drafts) {
      const isAlreadyPublished = draft.published || draft.draftStatus === 'published';
      const cleanTitle = (draft.title || '').trim().toLowerCase();

      // If draft was published and canonical product is already in items, skip to prevent double counting
      if (isAlreadyPublished && cleanTitle && seenProductNames.has(cleanTitle)) {
        continue;
      }

      const affiliateUrl = draft.affiliateUrl || '';
      const productUrl = draft.productUrl || '';
      const hasAffiliate = Boolean(affiliateUrl && affiliateUrl.trim().length > 0);
      const hasImage = Boolean(draft.image && draft.image.trim().length > 0);
      const needsAmazonVerification = Boolean(draft.amazonNeedsVerification);

      let draftComputedStatus: 'published' | 'review' | 'draft' = 'draft';
      if (draft.published || draft.draftStatus === 'published') {
        draftComputedStatus = 'published';
      } else if (draft.draftStatus === 'ready_to_publish') {
        draftComputedStatus = 'review';
      } else {
        draftComputedStatus = 'draft';
      }

      const item: UnifiedProductItem = {
        id: draft.id,
        isDraft: true,
        name: draft.title || 'Untitled Draft',
        slug: undefined,
        brand: draft.brand || 'Unbranded',
        category: draft.category || 'general',
        image: draft.image || '',
        images: draft.image ? [draft.image] : [],
        status: draftComputedStatus,
        lowestPrice: draft.currentPrice || undefined,
        storesCount: draft.merchantId ? 1 : 0,
        offers: [],
        hasAffiliate,
        affiliateUrl,
        productUrl,
        hasImage,
        amazonNeedsVerification: needsAmazonVerification,
        createdAt: draft.createdAt || '',
        updatedAt: draft.updatedAt || draft.createdAt || '',
        tags: draft.tags || [],
        rawDraft: draft,
      };

      items.push(item);
    }

    return items;
  }, [products, drafts]);

  // Status counts (calculated on all items)
  const statusCounts = useMemo(() => {
    let all = unifiedItems.length;
    let draftsCount = 0;
    let reviewCount = 0;
    let publishedCount = 0;

    for (const item of unifiedItems) {
      if (item.status === 'published') publishedCount++;
      else if (item.status === 'review') reviewCount++;
      else draftsCount++;
    }

    return {
      all,
      drafts: draftsCount,
      review: reviewCount,
      published: publishedCount,
    };
  }, [unifiedItems]);

  // Unique brands list for filter dropdown
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    for (const item of unifiedItems) {
      if (item.brand && item.brand.trim().length > 0) {
        set.add(item.brand.trim());
      }
    }
    for (const b of brands) {
      if (b.name) set.add(b.name.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [unifiedItems, brands]);

  // Unique categories list for filter dropdown
  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.slug, c.name);
    }
    for (const item of unifiedItems) {
      if (item.category && !map.has(item.category)) {
        map.set(item.category, item.category.charAt(0).toUpperCase() + item.category.slice(1));
      }
    }
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [categories, unifiedItems]);

  // Filtered and Sorted list
  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return unifiedItems
      .filter((item) => {
        // 1. Status Tab filter
        if (activeStatusTab !== 'all') {
          if (item.status !== activeStatusTab) return false;
        }

        // 2. Search box (case-insensitive multi-field)
        if (q.length > 0) {
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesBrand = item.brand.toLowerCase().includes(q);
          const matchesCategory = item.category.toLowerCase().includes(q);
          const matchesSlug = Boolean(item.slug && item.slug.toLowerCase().includes(q));
          const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));

          // Store name matching
          let matchesStore = false;
          if (item.isDraft && item.rawDraft?.merchantId) {
            const mId = item.rawDraft.merchantId.toLowerCase();
            const storeObj = stores.find((s) => s.id === item.rawDraft?.merchantId);
            if (mId.includes(q) || (storeObj && storeObj.name.toLowerCase().includes(q))) {
              matchesStore = true;
            }
          }
          if (item.offers && item.offers.length > 0) {
            matchesStore = item.offers.some((o) => {
              const sObj = stores.find((s) => s.id === o.storeId);
              return (
                o.storeId.toLowerCase().includes(q) ||
                (sObj && sObj.name.toLowerCase().includes(q))
              );
            });
          }

          if (
            !matchesName &&
            !matchesBrand &&
            !matchesCategory &&
            !matchesSlug &&
            !matchesTags &&
            !matchesStore
          ) {
            return false;
          }
        }

        // 3. Category Filter
        if (selectedCategory !== 'all') {
          if (item.category !== selectedCategory) return false;
        }

        // 4. Brand Filter
        if (selectedBrand !== 'all') {
          if (item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
        }

        // 5. Store Filter
        if (selectedStore !== 'all') {
          const hasStoreOffer = item.offers.some((o) => o.storeId === selectedStore);
          const isDraftForStore = item.rawDraft?.merchantId === selectedStore;
          if (!hasStoreOffer && !isDraftForStore) return false;
        }

        // 6. Affiliate Status Filter
        if (selectedAffiliateStatus === 'with_affiliate' && !item.hasAffiliate) {
          return false;
        }
        if (selectedAffiliateStatus === 'missing_affiliate' && item.hasAffiliate) {
          return false;
        }

        // 7. Image Status Filter
        if (selectedImageStatus === 'with_image' && !item.hasImage) {
          return false;
        }
        if (selectedImageStatus === 'missing_image' && item.hasImage) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return a.id.localeCompare(b.id);
        }
        if (sortBy === 'oldest') {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return a.id.localeCompare(b.id);
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name_desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'recently_updated') {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        return 0;
      });
  }, [
    unifiedItems,
    activeStatusTab,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedStore,
    selectedAffiliateStatus,
    selectedImageStatus,
    sortBy,
    stores,
  ]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim().length > 0 ||
      selectedCategory !== 'all' ||
      selectedBrand !== 'all' ||
      selectedStore !== 'all' ||
      selectedAffiliateStatus !== 'all' ||
      selectedImageStatus !== 'all' ||
      activeStatusTab !== 'all' ||
      sortBy !== 'newest'
    );
  }, [
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedStore,
    selectedAffiliateStatus,
    selectedImageStatus,
    activeStatusTab,
    sortBy,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim().length > 0) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedBrand !== 'all') count++;
    if (selectedStore !== 'all') count++;
    if (selectedAffiliateStatus !== 'all') count++;
    if (selectedImageStatus !== 'all') count++;
    if (activeStatusTab !== 'all') count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedStore,
    selectedAffiliateStatus,
    selectedImageStatus,
    activeStatusTab,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStore('all');
    setSelectedAffiliateStatus('all');
    setSelectedImageStatus('all');
    setActiveStatusTab('all');
    setSortBy('newest');
  };

  // Row Action Handlers
  const handleEditItem = (item: UnifiedProductItem) => {
    if (item.isDraft && item.rawDraft) {
      if (onEditDraft) onEditDraft(item.id);
    } else if (item.rawProduct) {
      onEditProduct(item.rawProduct);
    }
  };

  const handleDuplicateItem = (item: UnifiedProductItem) => {
    if (item.isDraft && item.rawDraft) {
      if (onDuplicateDraft) onDuplicateDraft(item.rawDraft);
    } else if (item.rawProduct) {
      onDuplicateProduct(item.rawProduct);
    }
  };

  const handleDeleteItem = (item: UnifiedProductItem) => {
    if (item.isDraft) {
      if (onDeleteDraft) onDeleteDraft(item.id);
    } else {
      onDeleteProduct(item.id, item.name);
    }
  };

  return (
    <div className="space-y-5" id="product-management-section">
      {/* 1. STATUS TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit overflow-x-auto max-w-full">
          <button
            id="tab-all"
            onClick={() => setActiveStatusTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeStatusTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>All</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeStatusTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {statusCounts.all}
            </span>
          </button>

          <button
            id="tab-drafts"
            onClick={() => setActiveStatusTab('draft')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeStatusTab === 'draft'
                ? 'bg-white text-amber-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Drafts</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeStatusTab === 'draft'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {statusCounts.drafts}
            </span>
          </button>

          <button
            id="tab-review"
            onClick={() => setActiveStatusTab('review')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeStatusTab === 'review'
                ? 'bg-white text-blue-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Review</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeStatusTab === 'review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {statusCounts.review}
            </span>
          </button>

          <button
            id="tab-published"
            onClick={() => setActiveStatusTab('published')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeStatusTab === 'published'
                ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Published</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeStatusTab === 'published'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {statusCounts.published}
            </span>
          </button>
        </div>

        {/* Action buttons: Export & Add Product */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {onExportExcel && (
            <button
              id="export-products-btn"
              onClick={onExportExcel}
              disabled={isExporting}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
              title="Export products to Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          )}

          <button
            id="add-new-product-btn"
            onClick={onOpenNewProduct}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2 & 3. SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Row 1: Global Search & Sort */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <input
              id="global-product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, brand, category, tags, or store (Amazon, Croma)..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sort:</span>
            </div>
            <select
              id="product-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A - Z)</option>
              <option value="name_desc">Name (Z - A)</option>
              <option value="recently_updated">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Row 2: Specific Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1 shrink-0">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`border rounded-xl px-3 py-1.5 font-medium outline-none cursor-pointer transition-colors ${
              selectedCategory !== 'all'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            id="filter-brand"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className={`border rounded-xl px-3 py-1.5 font-medium outline-none cursor-pointer transition-colors ${
              selectedBrand !== 'all'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Store Filter */}
          <select
            id="filter-store"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className={`border rounded-xl px-3 py-1.5 font-medium outline-none cursor-pointer transition-colors ${
              selectedStore !== 'all'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <option value="all">All Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Affiliate Status Filter */}
          <select
            id="filter-affiliate"
            value={selectedAffiliateStatus}
            onChange={(e) => setSelectedAffiliateStatus(e.target.value as any)}
            className={`border rounded-xl px-3 py-1.5 font-medium outline-none cursor-pointer transition-colors ${
              selectedAffiliateStatus !== 'all'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <option value="all">Affiliate: All</option>
            <option value="with_affiliate">✓ With Affiliate Link</option>
            <option value="missing_affiliate">⚠ Missing Affiliate Link</option>
          </select>

          {/* Image Status Filter */}
          <select
            id="filter-image"
            value={selectedImageStatus}
            onChange={(e) => setSelectedImageStatus(e.target.value as any)}
            className={`border rounded-xl px-3 py-1.5 font-medium outline-none cursor-pointer transition-colors ${
              selectedImageStatus !== 'all'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <option value="all">Image: All</option>
            <option value="with_image">✓ With Image</option>
            <option value="missing_image">⚠ Missing Image</option>
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              id="reset-filters-btn"
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 ml-auto transition-colors shadow-2xs"
              title="Reset all search queries, status tabs, and filters"
            >
              <RotateCcw className="w-3 h-3 text-rose-600" />
              <span>Reset Filters</span>
              <span className="bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded-full text-[10px]">
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 4. RESULTS SUMMARY & ACTIVE CHIPS */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div>
          Showing{' '}
          <strong className="text-slate-900 font-bold">
            {filteredAndSortedItems.length}
          </strong>{' '}
          of <strong className="text-slate-900 font-bold">{unifiedItems.length}</strong> products
          {activeStatusTab !== 'all' && (
            <span className="ml-1 text-slate-400">
              (in <span className="capitalize font-semibold text-slate-600">{activeStatusTab}</span>)
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBrand !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
                Brand: {selectedBrand}
                <button onClick={() => setSelectedBrand('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStore !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
                Store: {stores.find((s) => s.id === selectedStore)?.name || selectedStore}
                <button onClick={() => setSelectedStore('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedAffiliateStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
                {selectedAffiliateStatus === 'with_affiliate' ? 'With Affiliate' : 'Missing Affiliate'}
                <button onClick={() => setSelectedAffiliateStatus('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedImageStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
                {selectedImageStatus === 'with_image' ? 'With Image' : 'Missing Image'}
                <button onClick={() => setSelectedImageStatus('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5 & 6. DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="products-table">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold text-slate-600">Product</th>
                <th className="py-3.5 px-3 font-bold text-slate-600">Category</th>
                <th className="py-3.5 px-3 font-bold text-slate-600">Status</th>
                <th className="py-3.5 px-3 font-bold text-slate-600">Affiliate</th>
                <th className="py-3.5 px-3 font-bold text-slate-600">Image</th>
                <th className="py-3.5 px-3 font-bold text-slate-600">Updated</th>
                <th className="py-3.5 px-4 text-right font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAndSortedItems.map((item) => (
                <tr
                  key={item.id}
                  id={`product-row-${item.id}`}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Column 1: Product info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 shrink-0 rounded-xl p-1 bg-slate-50 border border-slate-200/90 flex items-center justify-center overflow-hidden">
                        {item.hasImage ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 block line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </span>
                          {item.isDraft && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded">
                              Draft Doc
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-600">{item.brand}</span>
                          {item.lowestPrice ? (
                            <>
                              <span>•</span>
                              <span className="font-bold text-slate-800">
                                {formatINR(item.lowestPrice)}
                              </span>
                            </>
                          ) : null}
                          {item.storesCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{item.storesCount} {item.storesCount === 1 ? 'store' : 'stores'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Category */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold capitalize">
                      {item.category}
                    </span>
                  </td>

                  {/* Column 3: Status Indicator */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {item.status === 'published' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> Published
                        </span>
                      )}
                      {item.status === 'review' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Activity className="w-3 h-3 text-blue-600" /> In Review
                        </span>
                      )}
                      {item.status === 'draft' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <AlertTriangle className="w-3 h-3 text-amber-500" /> Draft
                        </span>
                      )}

                      {/* Amazon duplicate link verification notice */}
                      {item.amazonNeedsVerification && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                          title="This item was duplicated and requires verifying the Amazon URL"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-700" /> Verify Link
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 4: Affiliate Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {item.hasAffiliate ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          title="Affiliate URL is configured"
                        >
                          <Check className="w-3 h-3 text-emerald-600" /> Affiliate Added
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80"
                          title="Affiliate link is missing"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Affiliate Missing
                        </span>
                      )}

                      {/* Quick Amazon button if URL available */}
                      {item.productUrl && (
                        <div className="mt-0.5">
                          <AmazonQuickActions
                            productUrl={item.productUrl}
                            affiliateUrl={item.affiliateUrl}
                            size="compact"
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Column 5: Image Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {item.hasImage ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        title="Product image is available"
                      >
                        <Check className="w-3 h-3 text-emerald-600" /> Image Added
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80"
                        title="No image uploaded"
                      >
                        <ImageOff className="w-3 h-3 text-rose-500" /> Image Missing
                      </span>
                    )}
                  </td>

                  {/* Column 6: Updated */}
                  <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {formatDate(item.updatedAt || item.createdAt)}
                  </td>

                  {/* Column 7: Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Review / Publish action if in review */}
                      {item.status === 'review' && (
                        <button
                          id={`btn-review-${item.id}`}
                          onClick={() => handleEditItem(item)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                          title="Review and publish product to live store"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Review / Publish</span>
                        </button>
                      )}

                      {/* Edit action */}
                      <button
                        id={`btn-edit-${item.id}`}
                        onClick={() => handleEditItem(item)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Edit product details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      {/* Duplicate action */}
                      <button
                        id={`btn-duplicate-${item.id}`}
                        onClick={() => handleDuplicateItem(item)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Duplicate as new draft"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Duplicate</span>
                      </button>

                      {/* Open Amazon action */}
                      {item.productUrl && (
                        <OpenAmazonButton
                          url={item.productUrl}
                          size="sm"
                          showLabel={false}
                          className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900"
                        />
                      )}

                      {/* View live in store (if published with slug) */}
                      {!item.isDraft && item.slug && item.status === 'published' && (
                        <button
                          id={`btn-view-${item.id}`}
                          onClick={() => onNavigate(`/product/${item.slug}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View live product"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Manage store offers (if product) */}
                      {!item.isDraft && (
                        <button
                          id={`btn-add-offer-${item.id}`}
                          onClick={() => onOpenAddOffer(item.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Add / manage store offers"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete action */}
                      <button
                        id={`btn-delete-${item.id}`}
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MOBILE CARD VIEW (Responsive layout — no horizontal scroll on mobile) */}
      <div className="block md:hidden space-y-3">
        {filteredAndSortedItems.map((item) => (
          <div
            key={item.id}
            id={`mobile-product-card-${item.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
          >
            {/* Header: Image, Title, Brand, Category */}
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 shrink-0 rounded-xl p-1 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                {item.hasImage ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.brand}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {item.category}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                  {item.name}
                </h4>
                {item.lowestPrice ? (
                  <div className="text-xs font-extrabold text-slate-900 mt-1">
                    {formatINR(item.lowestPrice)}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Quick Badges: Status, Affiliate, Image, Verification */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              {item.status === 'published' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> Published
                </span>
              )}
              {item.status === 'review' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Activity className="w-3 h-3 text-blue-600" /> In Review
                </span>
              )}
              {item.status === 'draft' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Draft
                </span>
              )}

              {item.hasAffiliate ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <Check className="w-3 h-3 text-emerald-600" /> Affiliate Added
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Affiliate Missing
                </span>
              )}

              {item.hasImage ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <Check className="w-3 h-3 text-emerald-600" /> Image Added
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                  <ImageOff className="w-3 h-3 text-rose-500" /> Image Missing
                </span>
              )}

              {item.amazonNeedsVerification && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertTriangle className="w-3 h-3 text-amber-700" /> Verify Link
                </span>
              )}
            </div>

            {/* Mobile Actions Toolbar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Updated {formatDate(item.updatedAt || item.createdAt)}
              </span>

              <div className="flex items-center gap-1.5">
                {item.status === 'review' && (
                  <button
                    onClick={() => handleEditItem(item)}
                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>
                )}

                <button
                  onClick={() => handleEditItem(item)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  title="Edit product"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDuplicateItem(item)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  title="Duplicate as new draft"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                </button>

                {item.productUrl && (
                  <OpenAmazonButton
                    url={item.productUrl}
                    size="sm"
                    showLabel={false}
                    className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900"
                  />
                )}

                {!item.isDraft && item.slug && item.status === 'published' && (
                  <button
                    onClick={() => onNavigate(`/product/${item.slug}`)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                    title="View live"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteItem(item)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 8. EMPTY STATES */}
      {filteredAndSortedItems.length === 0 && (
        <div
          id="product-empty-state"
          className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center space-y-4 shadow-2xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <PackageSearch className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {hasActiveFilters
                ? 'No products found matching your filters'
                : activeStatusTab === 'draft'
                ? 'No draft products yet'
                : activeStatusTab === 'review'
                ? 'No review products yet'
                : activeStatusTab === 'published'
                ? 'No published products yet'
                : 'No products in catalog yet'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {hasActiveFilters
                ? 'Try adjusting your search terms, changing categories, or clearing active filters.'
                : activeStatusTab === 'draft'
                ? 'Create a draft or duplicate any existing product to begin building a new draft.'
                : activeStatusTab === 'review'
                ? 'Drafts that meet all mandatory publishing requirements will automatically appear here for final review.'
                : activeStatusTab === 'published'
                ? 'Publish your first reviewed product to have it appear live in your Findora comparison store.'
                : 'Get started by adding your first product offer or importing in bulk.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters ? (
              <button
                id="empty-state-reset-btn"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                id="empty-state-add-btn"
                onClick={onOpenNewProduct}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
