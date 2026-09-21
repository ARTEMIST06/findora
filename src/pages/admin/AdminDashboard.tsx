import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Store,
  Tag,
  MousePointerClick,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  DollarSign,
  Copy,
  BarChart3,
} from 'lucide-react';
import { BulkImport } from './BulkImport';
import { DraftsDashboard } from './DraftsDashboard';
import { DraftEditor } from './DraftEditor';
import { CategoriesDashboard } from './CategoriesDashboard';
import { BrandsDashboard } from './BrandsDashboard';
import { FileUp } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
import { logAuditEvent } from '../../services/audit';
import { OpenAmazonButton } from '../../components/admin/OpenAmazonButton';
import { AmazonQuickActions } from '../../components/admin/AmazonQuickActions';
import { ProductImageManager } from '../../components/admin/ProductImageManager';
import { ProductManagement } from '../../components/admin/ProductManagement';
import { getAmazonProductUrl, getAmazonAffiliateUrl } from '../../utils/amazon';
import { Product, Store as StoreType, PriceOffer, ProductDraft, Brand } from '../../types';
import { formatINR, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();

  const currentUser = store.getCurrentUser();


  const isAdmin = true;
  const isEditor = true;

  const products = store.getAllProductsWithPrices(false); // including unpublished
  const stores = store.getStores();
  const categories = store.getCategories();
  const clicks = store.getAffiliateClicks();

  // Active admin tab
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'drafts' | 'categories' | 'brands' | 'offers' | 'stores' | 'clicks' | 'bulk-import'>(
    'overview'
  );

  // Drafts state for unified product management
  const [drafts, setDrafts] = useState<ProductDraft[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const loadDrafts = React.useCallback(async () => {
    try {
      const data = await store.getDrafts();
      setDrafts(data || []);
    } catch (err) {
      console.error('Error loading drafts in AdminDashboard:', err);
    }
  }, [store]);

  React.useEffect(() => {
    loadDrafts();
    store.getBrands().then((b) => setBrands(b || []));
  }, [loadDrafts, store]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingProductOffers, setEditingProductOffers] = useState<Partial<PriceOffer>[]>([]);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<PriceOffer> | null>(null);

  // Product Fetch State
  const [fetchMerchantId, setFetchMerchantId] = useState('');
  const [fetchUrl, setFetchUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{success?: boolean; message?: string} | null>(null);
  const [fetchedFields, setFetchedFields] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  const handleFetchProduct = async () => {
    if (!fetchMerchantId || !fetchUrl) return;
    setIsFetching(true);
    setFetchResult(null);
    setFetchedFields({});
    try {
      const res = await fetch('/api/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl, merchantId: fetchMerchantId })
      });
      const data = await res.json();
      
      if (!data.success) {
        setFetchResult({ success: false, message: data.message || 'Error fetching product' });
        return;
      }
      
      const resData = data.product;

      let duplicateProduct: any = null;
      if (resData.merchantProductId) {
        const offers = store.getOffers();
        const existingOffer = offers.find(o => o.storeId === fetchMerchantId && o.merchantProductId === resData.merchantProductId);
        if (existingOffer) {
           const allProds = store.getAllProductsWithPrices(false);
           duplicateProduct = allProds.find(p => p.id === existingOffer.productId);
        }
      }

      if (duplicateProduct) {
         setFetchResult({ success: false, message: `This merchant product may already exist as "${duplicateProduct.name}". Continue anyway or edit existing.` });
      } else {
        // Populate form
        setEditingProduct({
          ...editingProduct,
          name: resData.title || editingProduct?.name || '',
          brand: resData.brand || editingProduct?.brand || '',
          category: resData.category || editingProduct?.category || categories[0]?.slug,
          images: resData.images?.length ? resData.images : (editingProduct?.images || []),
        });
        
        // Update first offer
        const newOffers = [...editingProductOffers];
        if (newOffers.length === 0) {
          newOffers.push({ storeId: fetchMerchantId, price: "" as any, originalPrice: "" as any, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' });
        }
        
        newOffers[0] = {
          ...newOffers[0],
          storeId: fetchMerchantId,
          price: (resData.price !== undefined && resData.price !== null) ? resData.price : (resData.currentPrice !== undefined ? resData.currentPrice : newOffers[0].price),
          originalPrice: resData.originalPrice || resData.mrp || newOffers[0].originalPrice,
          availability: resData.availability || newOffers[0].availability,
          merchantProductId: resData.merchantProductId || newOffers[0].merchantProductId,
          productUrl: fetchUrl,
          affiliateUrl: resData.affiliateUrl || newOffers[0].affiliateUrl,
          syncStatus: resData.isManualCommercial ? 'manual' : (resData.merchantProductId ? 'automatic' : 'manual')
        };
        
        setEditingProductOffers(newOffers);
        
        setFetchedFields({
          name: !!resData.title,
          brand: !!resData.brand,
          category: !!resData.category,
          images: !!(resData.images && resData.images.length),
          price: !!(resData.price || resData.currentPrice) && !resData.isManualCommercial,
          originalPrice: !!(resData.originalPrice || resData.mrp) && !resData.isManualCommercial,
          availability: !!resData.availability && !resData.isManualCommercial,
          merchantProductId: !!resData.merchantProductId,
          productUrl: true,
          affiliateUrl: !!resData.affiliateUrl && !resData.isManualCommercial
        });

        setFetchResult({ success: true, message: 'Product information fetched automatically.' });
      }
    } catch (e: any) {
      setFetchResult({ success: false, message: e.message || 'Error fetching product' });
    } finally {
      setIsFetching(false);
    }
  };

  const [targetProductIdForOffer, setTargetProductIdForOffer] = useState<string>('');

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Partial<StoreType> | null>(null);

  const authLoading = store.isAuthLoading();
if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authenticating...</h2>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#0D1322] border border-slate-800 flex items-center justify-center mx-auto mb-5 shadow-xl">
          <ShieldCheck className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">Authentication Required</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">You must be logged in with administrative credentials to access this control center.</p>
        <button
          onClick={() => onNavigate('/login')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
        >
          Sign In to Account
        </button>
      </div>
    );
  }

  // Role check guard: If shopper, show permission message
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'editor') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-xl">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
          Your current account role is <strong className="text-white">{currentUser?.role || 'Shopper'}</strong>. This area requires Administrator or Editor permissions.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="px-6 py-2.5 rounded-full border border-slate-700 bg-[#0D1322] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // --- Metrics Calculation ---
  const totalOffersCount = products.reduce((acc, p) => acc + p.offers.length, 0);
  const totalClicksCount = clicks.length;
  const estimatedRevenue = totalClicksCount * 45; // ~₹45 per outbound lead average
  const featuredCount = products.filter((p) => p.featured).length;

  // --- Product Management Handlers ---
    const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const allProducts = store.getAllProductsWithPrices(false); // get all including drafts
      const allStores = store.getStores();
      
      const exportData = allProducts.map(p => {
        const primaryOffer = p.offers && p.offers.length > 0 ? p.offers[0] : null;
        let merchantName = '';
        if (primaryOffer) {
           const st = allStores.find(s => s.id === primaryOffer.storeId);
           if (st) merchantName = st.name;
        }

        return {
          merchant: merchantName,
          productUrl: primaryOffer?.productUrl || '',
          affiliateUrl: primaryOffer?.affiliateUrl || '',
          title: p.name || '',
          brand: p.brand || '',
          category: p.category || '',
          image: p.images && p.images.length > 0 ? p.images[0] : '',
          currentPrice: primaryOffer?.price || '',
          mrp: primaryOffer?.originalPrice || '',
          availability: primaryOffer?.availability || 'in_stock',
          badge: p.badge || '',
          shortPitch: p.shortDescription || '',
          whyFindoraPickedIt: p.whyFindora || '',
          published: p.published !== false,
          featured: !!p.featured,
          productId: p.id,
          merchantProductId: primaryOffer?.merchantProductId || ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, "Findora_Products_Export.xlsx");
      showToast('success', 'Products exported successfully!');
    } catch (err: any) {
      console.error("Export Error: ", err);
      showToast('error', err.message || 'Failed to export products');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenNewProduct = () => {
    setEditingProduct({
      name: '',
      slug: '',
      brand: '',
      category: categories[0]?.slug || 'smartphones',
      shortDescription: '',
      description: '',
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'],
      specifications: { Display: '', Processor: '', Storage: '', Camera: '', Battery: '' },
      whyFindora: 'Exceptional flagship performance and balanced ergonomics.',
      pros: ['Premium build quality', 'Long battery life', 'Fast charging'],
      cons: ['High price tag', 'No headphone jack'],
      tags: ['electronics', 'flagship'],
      rating: 4.8,
      reviewCount: 120,
      badge: 'New Arrival',
      published: true,
      featured: false,
    });
    setEditingProductOffers([{ storeId: '', price: "" as any, originalPrice: "" as any, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' }]);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct({ ...p });
    const productOffers = store.getOffers().filter(o => o.productId === p.id);
    setEditingProductOffers(productOffers.length > 0 ? [...productOffers] : [
      { storeId: stores[0]?.id || '', price: "" as any, originalPrice: "" as any, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' }
    ]);
    setIsProductModalOpen(true);
  };

  const handleDuplicateProduct = async (prod: Product) => {
    try {
      const newDraft = await store.duplicateProductToDraft(prod.id);
      if (newDraft) {
        showToast(`Duplicated "${prod.name}" into a new draft: "${newDraft.title}"`, 'success');
        loadDrafts();
        if (currentUser) {
          logAuditEvent({
            actorUid: currentUser.id,
            actorRole: (currentUser.role as any) || 'admin',
            actorEmail: currentUser.email,
            action: 'PRODUCT_DUPLICATED',
            targetType: 'product',
            targetId: prod.id,
            targetName: prod.name,
            details: { newDraftId: newDraft.id, originalProductId: prod.id },
          }).catch(() => {});
        }
      } else {
        showToast('Failed to duplicate product', 'error');
      }
    } catch (err: any) {
      console.error("Duplicate product error:", err);
      showToast(err.message || 'Failed to duplicate product', 'error');
    }
  };

  const handleDuplicateDraft = async (draft: ProductDraft) => {
    try {
      const newDraft = await store.duplicateDraft(draft.id);
      if (newDraft) {
        showToast(`Draft duplicated as "${newDraft.title}"`, 'success');
        loadDrafts();
        if (currentUser) {
          logAuditEvent({
            actorUid: currentUser.id,
            actorRole: (currentUser.role as any) || 'admin',
            actorEmail: currentUser.email,
            action: 'PRODUCT_DUPLICATED',
            targetType: 'draft',
            targetId: draft.id,
            targetName: draft.title,
            details: { newDraftId: newDraft.id, originalDraftId: draft.id },
          }).catch(() => {});
        }
      } else {
        showToast('Failed to duplicate draft', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error duplicating draft', 'error');
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      try {
        await store.deleteDraft(draftId);
        showToast('Draft deleted', 'success');
        loadDrafts();
        if (currentUser) {
          logAuditEvent({
            actorUid: currentUser.id,
            actorRole: (currentUser.role as any) || 'admin',
            actorEmail: currentUser.email,
            action: 'PRODUCT_DELETED',
            targetType: 'draft',
            targetId: draftId,
            targetName: `Draft ${draftId}`,
          }).catch(() => {});
        }
      } catch (err: any) {
        showToast(err.message || 'Error deleting draft', 'error');
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct.brand) {
      showToast('Please provide a product title and brand', 'error');
      return;
    }
    
    // Validate offers if published
    const validOffers = editingProductOffers.filter(o => o.storeId && o.price && o.price > 0 && o.affiliateUrl);
    if ((editingProduct.published ?? true) && validOffers.length === 0) {
      showToast('You must add at least one valid store offer to publish this product.', 'error');
      return;
    }

    try {
      const slug =
        editingProduct.slug ||
        editingProduct.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      let savedProductId = editingProduct.id;

      if (editingProduct.id) {
        // Update
        await store.updateProduct(editingProduct.id, {
          ...editingProduct,
          slug,
        });
        
      } else {
        // Add
        const newProd = await store.addProduct({
          ...editingProduct,
          slug,
          rating: editingProduct.rating || 4.5,
          reviewCount: editingProduct.reviewCount || 10,
          published: editingProduct.published ?? true,
          featured: editingProduct.featured ?? false,
        } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        savedProductId = newProd.id;
        
      }

      // Save offers
      if (savedProductId) {
        for (const offer of editingProductOffers) {
          if (!offer.storeId || !offer.price || offer.price <= 0 || !offer.affiliateUrl) continue; // Skip invalid
          
          if (offer.id) {
            await store.updatePriceOffer(offer.id, {
              ...offer,
              productId: savedProductId,
              price: Number(offer.price),
              originalPrice: offer.originalPrice ? Number(offer.originalPrice) : undefined
            });
          } else {
            await store.addPriceOffer({
              productId: savedProductId,
              storeId: offer.storeId,
              price: Number(offer.price),
              originalPrice: offer.originalPrice ? Number(offer.originalPrice) : undefined,
              currency: offer.currency || 'INR',
              affiliateUrl: offer.affiliateUrl,
              availability: offer.availability || 'in_stock',
              sourceType: offer.sourceType || 'manual'
            } as Omit<PriceOffer, 'id' | 'lastUpdated'>);
          }
        }
      }


      setIsProductModalOpen(false);
      showToast(editingProduct.id ? `Updated "${editingProduct.name}" and its offers` : `Added new product "${editingProduct.name}" and its offers`, 'success');

      if (currentUser) {
        logAuditEvent({
          actorUid: currentUser.id,
          actorRole: (currentUser.role as any) || 'admin',
          actorEmail: currentUser.email,
          action: editingProduct.id ? 'PRODUCT_EDITED' : 'PRODUCT_CREATED',
          targetType: 'product',
          targetId: savedProductId || editingProduct.id,
          targetName: editingProduct.name,
          details: { category: editingProduct.category, brand: editingProduct.brand, offersCount: editingProductOffers.length },
        }).catch(() => {});
      }
    } catch (err: any) {

      console.error(err);
      showToast(err.message || 'Error saving product and offers.', 'error');
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      store.deleteProduct(id);
      showToast(`Deleted "${name}"`, 'info');
      if (currentUser) {
        logAuditEvent({
          actorUid: currentUser.id,
          actorRole: (currentUser.role as any) || 'admin',
          actorEmail: currentUser.email,
          action: 'PRODUCT_DELETED',
          targetType: 'product',
          targetId: id,
          targetName: name,
        }).catch(() => {});
      }
    }
  };

  // --- Offers Management Handlers ---
  const handleOpenAddOffer = (productId: string) => {
    setTargetProductIdForOffer(productId);
    setEditingOffer({
      productId,
      storeId: stores[0]?.id || 'store-amazon',
      price: 99999,
      originalPrice: 109999,
      affiliateUrl: 'https://amazon.in/?tag=findora-21',
      inStock: true,
      shippingNote: 'Free Next-Day Delivery with Prime',
    });
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer || !targetProductIdForOffer || !editingOffer.storeId || !editingOffer.price) {
      showToast('Please fill out store and price', 'error');
      return;
    }

    await store.setOffer(targetProductIdForOffer, {
      storeId: editingOffer.storeId,
      price: Number(editingOffer.price),
      originalPrice: editingOffer.originalPrice ? Number(editingOffer.originalPrice) : undefined,
      affiliateUrl: editingOffer.affiliateUrl || 'https://amazon.in',
      inStock: editingOffer.inStock ?? true,
      shippingNote: editingOffer.shippingNote || 'In Stock, Fast Delivery',
    });

    showToast('Store offer and live price updated!', 'success');
    setIsOfferModalOpen(false);

    if (currentUser) {
      logAuditEvent({
        actorUid: currentUser.id,
        actorRole: (currentUser.role as any) || 'admin',
        actorEmail: currentUser.email,
        action: 'AFFILIATE_LINK_UPDATED',
        targetType: 'offer',
        targetId: targetProductIdForOffer,
        targetName: `Offer for ${targetProductIdForOffer}`,
        details: { storeId: editingOffer.storeId, price: editingOffer.price, affiliateUrl: editingOffer.affiliateUrl },
      }).catch(() => {});
    }
  };

  const handleDeleteOffer = (offerId: string) => {
    store.deleteOffer(offerId);
    showToast('Offer removed', 'info');
  };

  // --- Stores Management Handlers ---
  const handleOpenNewStore = () => {
    setEditingStore({
      name: '',
      slug: '',
      logo: '',
      websiteUrl: 'https://',
      affiliateParamKey: 'tag',
      defaultAffiliateTag: 'findora-21',
      active: true,
    });
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore?.name) {
      showToast('Store name is required', 'error');
      return;
    }
    const slug =
      editingStore.slug ||
      editingStore.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (editingStore.id) {
      store.updateStore(editingStore.id, { ...editingStore, slug });
      showToast(`Updated store "${editingStore.name}"`, 'success');
    } else {
      store.addStore({
        ...editingStore,
        slug,
        active: editingStore.active ?? true,
      } as Omit<StoreType, 'id' | 'createdAt'>);
      showToast(`Added store "${editingStore.name}"`, 'success');
    }
    setIsStoreModalOpen(false);
  };

  return (
    <div className="admin-container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 min-h-screen text-slate-100">
      <SEOHead 
        title="Admin Dashboard - Findora"
        description="Manage products, store pricing, and track affiliate clicks in the Findora admin dashboard."
      />
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>Findora Platform Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin & Pricing Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.role})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 border border-slate-700 bg-[#0D1322] hover:bg-slate-800 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>View Public Site</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => onNavigate('/admin/analytics')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics & Audit</span>
              <span className="sm:hidden">Analytics</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('bulk-import')}
            className="px-4 py-2 border border-slate-700 bg-[#0D1322] hover:bg-slate-800 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <FileUp className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Import Products</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-2 border border-slate-700 bg-[#0D1322] hover:bg-slate-800 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : <Download className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Products'}</span>
            <span className="sm:hidden">{isExporting ? 'Wait' : 'Export'}</span>
          </button>
          <button
            onClick={handleOpenNewProduct}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'drafts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>Drafts</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Categories</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'brands'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Brands</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'offers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Store Pricing & Offers ({totalOffersCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'stores'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Stores & Retailers ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clicks')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'clicks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MousePointerClick className="w-4 h-4" />
          <span>Affiliate Outbound Clicks ({totalClicksCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('bulk-import')}
          className={`px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'bulk-import'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Bulk Import</span>
        </button>
      </div>


            {/* TAB: BULK IMPORT */}
      {activeTab === 'drafts' && <DraftsDashboard />}
      {activeTab === 'categories' && <CategoriesDashboard />}
      {activeTab === 'brands' && <BrandsDashboard />}

      {activeTab === 'bulk-import' && (
        <BulkImport onImportComplete={() => setActiveTab('products')} />
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Catalog
                </span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {products.length}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                {featuredCount} featured on homepage
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Live Store Prices
                </span>
                <Tag className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {totalOffersCount}
              </div>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">
                Across {stores.length} connected retailers
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Referral Clicks
                </span>
                <MousePointerClick className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {totalClicksCount}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Outbound store redirects</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Est. Affiliate Value
                </span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
                {formatINR(estimatedRevenue)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Based on referral transactions</span>
            </div>
          </div>

          {/* Quick Actions & Recent Outbound Clicks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions Panel */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Quick Catalog Operations</h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <button
                  onClick={handleOpenNewProduct}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-colors text-left flex flex-col justify-between"
                >
                  <Plus className="w-5 h-5 text-blue-600 mb-2" />
                  <span className="text-slate-900">Add New Device</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Create new product entry
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('offers')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-left flex flex-col justify-between"
                >
                  <Tag className="w-5 h-5 text-emerald-600 mb-2" />
                  <span className="text-slate-900">Update Prices</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Adjust Amazon & Flipkart rates
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('stores')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors text-left flex flex-col justify-between"
                >
                  <Store className="w-5 h-5 text-indigo-600 mb-2" />
                  <span className="text-slate-900">Manage Retailers</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Affiliate tags & domains
                  </span>
                </button>

                <button
                  onClick={() => {
                    store.resetToDefaults();
                    showToast('Catalog reset to initial state with latest pricing', 'success');
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 transition-colors text-left flex flex-col justify-between"
                >
                  <RefreshCw className="w-5 h-5 text-rose-600 mb-2" />
                  <span className="text-slate-900">Reset Demo Data</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Restore mock catalog
                  </span>
                </button>
              </div>
            </div>

            {/* Recent Affiliate Click Stream */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Recent Store Referrals</h3>
                <span className="text-xs text-blue-600 font-medium">Live Feed</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {clicks.length > 0 ? (
                  clicks.slice(0, 6).map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[240px]">
                          {c.productName}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Clicked <strong className="text-slate-700">{c.storeName}</strong> ({formatINR(c.price)})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(c.timestamp)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No clicks recorded yet. Click "Check Price" on any product to simulate!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS TABLE */}
      {activeTab === 'products' && (
        editingDraftId ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <DraftEditor
              draftId={editingDraftId}
              onBack={() => {
                setEditingDraftId(null);
                loadDrafts();
                store.getAllProductsWithPrices(false);
              }}
            />
          </div>
        ) : (
          <ProductManagement
            products={products}
            drafts={drafts}
            categories={categories}
            brands={brands}
            stores={stores}
            onOpenNewProduct={handleOpenNewProduct}
            onEditProduct={handleEditProduct}
            onDuplicateProduct={handleDuplicateProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenAddOffer={handleOpenAddOffer}
            onNavigate={onNavigate}
            onEditDraft={(draftId) => setEditingDraftId(draftId)}
            onDuplicateDraft={handleDuplicateDraft}
            onDeleteDraft={handleDeleteDraft}
            onExportExcel={handleExportExcel}
            isExporting={isExporting}
          />
        )
      )}

      {/* TAB 3: OFFERS / STORE PRICING TABLE */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Store Pricing Matrix</h3>
              <p className="text-xs text-slate-500">
                Manage offers from Amazon, Flipkart, Croma, and Reliance Digital for each product.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-8 h-8 object-contain rounded-md bg-white border border-slate-200 p-0.5"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{prod.name}</h4>
                      <span className="text-[11px] text-slate-400">
                        Lowest price: <strong className="text-emerald-600">{formatINR(prod.lowestPrice)}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAddOffer(prod.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Store Offer</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {prod.offers.map((offer) => {
                    const storeObj = stores.find((s) => s.id === offer.storeId);
                    return (
                      <div
                        key={offer.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-xs w-28">
                            {storeObj?.name || offer.storeId}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {formatINR(offer.price)}
                            </span>
                            {offer.originalPrice && (
                              <span className="text-xs text-slate-400 line-through ml-2">
                                MRP {formatINR(offer.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-slate-500 text-[11px] hidden md:inline truncate max-w-xs">
                            {offer.shippingNote || 'Standard'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Updated {formatRelativeTime(offer.lastUpdated)}
                          </span>

                          <button
                            onClick={() => {
                              setTargetProductIdForOffer(prod.id);
                              setEditingOffer({ ...offer });
                              setIsOfferModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="Edit price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STORES TABLE */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Partner Retailers</h3>
              <p className="text-xs text-slate-500">
                Configure supported ecommerce storefronts, base domains, and affiliate tracking tags.
              </p>
            </div>
            <button
              onClick={handleOpenNewStore}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner Store</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{s.websiteUrl}</p>
                  <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                    <div>
                      Tag Parameter: <code className="text-blue-600 font-mono">{s.affiliateParamKey}</code>
                    </div>
                    <div>
                      Default Referral ID:{' '}
                      <code className="text-emerald-700 font-mono">{s.defaultAffiliateTag || 'N/A'}</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingStore({ ...s });
                      setIsStoreModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AFFILIATE CLICKS TABLE */}
      {activeTab === 'clicks' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Affiliate Outbound Referral Log</h3>
            <p className="text-xs text-slate-500">
              Live tracking log of every user click on "Check Price" or "Go to Deal" across all stores.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Merchant Store</th>
                  <th className="py-3.5 px-4">Offer Price</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clicks.length > 0 ? (
                  clicks.map((click) => (
                    <tr key={click.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{click.productName}</td>
                      <td className="py-3 px-4 text-blue-600 font-semibold">{click.storeName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(click.price)}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(click.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={click.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-600"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No clicks recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingProduct.id ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

                        <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">

              {/* FETCH PRODUCT URL */}
              {!editingProduct.id && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">ADD PRODUCT</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Merchant</label>
                      <select
                        value={fetchMerchantId}
                        onChange={(e) => setFetchMerchantId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="">Select Merchant</option>
                        {stores.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Product URL</label>
                      <input
                        type="url"
                        value={fetchUrl}
                        onChange={(e) => setFetchUrl(e.target.value)}
                        placeholder="Paste merchant product URL"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleFetchProduct}
                      disabled={isFetching || !fetchUrl || !fetchMerchantId}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      {isFetching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <span>Fetch Product</span>
                      )}
                    </button>
                    {fetchResult && (
                      <div className={`text-sm font-semibold flex items-center gap-1.5 ${fetchResult.success ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {fetchResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>{fetchResult.message}</span>
                      </div>
                    )}
                  </div>
                  {fetchResult && !fetchResult.success && (
                    <div className="text-xs text-slate-500 mt-2">
                      Please verify/enter the information manually below.
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">PRODUCT INFORMATION</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Product Title *{fetchedFields.name && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="Apple iPhone 16 Pro (128GB)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Brand *{fetchedFields.brand && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.brand || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      placeholder="Apple, Samsung, Sony..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Category{fetchedFields.category && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                    <select
                      value={editingProduct.category || categories[0]?.slug}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Badge (Optional)</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      placeholder="Editor's Pick, Best Value..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Short Pitch / Subtitle</label>
                  <input
                    type="text"
                    value={editingProduct.shortDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <ProductImageManager
                    imageUrl={editingProduct.images?.[0] || ''}
                    onChange={(newUrl) => {
                      const rest = editingProduct.images?.slice(1) || [];
                      setEditingProduct({
                        ...editingProduct,
                        images: newUrl ? [newUrl, ...rest] : rest
                      });
                    }}
                    label="Product Image"
                    required
                    helperText="Image preview, replace, and remove are supported. Existing image references are preserved safely."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Why Findora Picked It</label>
                  <textarea
                    rows={2}
                    value={editingProduct.whyFindora || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, whyFindora: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-sm text-slate-900">STORE OFFERS & PRICING</h4>
                  <button type="button" onClick={() => setEditingProductOffers([...editingProductOffers, { storeId: stores[0]?.id || '', price: "" as any, originalPrice: "" as any, affiliateUrl: '', availability: 'in_stock', currency: 'INR', sourceType: 'manual' }])} className="text-blue-600 font-semibold hover:text-blue-700">+ Add Offer</button>
                </div>
                
                {editingProductOffers.map((offer, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">Offer {idx + 1}</span>
                      {editingProductOffers.length > 1 && (
                        <button type="button" onClick={() => setEditingProductOffers(editingProductOffers.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-semibold">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Store *</label>
                        <select
                          required
                          value={offer.storeId || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], storeId: e.target.value  }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="">Select Store</option>
                          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Availability *{fetchedFields.availability && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <select
                          required
                          value={offer.availability || 'in_stock'}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], availability: e.target.value  as any }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="pre_order">Pre-order</option>
                          <option value="limited_stock">Limited Stock</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Current Price (₹) *{fetchedFields.price && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={offer.price || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], price: Number(e.target.value) }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">MRP (₹){fetchedFields.price && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <input
                          type="number"
                          min={0}
                          value={offer.originalPrice || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], originalPrice: Number(e.target.value) }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Merchant Product ID{fetchedFields.merchantProductId && idx === 0 && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                        <input
                          type="text"
                          value={offer.merchantProductId || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], merchantProductId: e.target.value }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700">Original Product URL{fetchedFields.productUrl && idx === 0 && <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span>}</label>
                          <OpenAmazonButton url={offer.productUrl} size="compact" />
                        </div>
                        <input
                          type="url"
                          value={offer.productUrl || ''}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], productUrl: e.target.value }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Sync Status</label>
                        <select
                          value={offer.syncStatus || 'manual'}
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], syncStatus: e.target.value as any }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="manual">Manual</option>
                          <option value="automatic">Automatic Sync</option>
                          <option value="error">Error</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-700">Affiliate URL (Tracked Link) *{fetchedFields.affiliateUrl && idx === 0 ? <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ AUTO</span> : (idx === 0 && <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">✎ MANUAL</span>)}</label>
                        <input
                          type="url"
                          required
                          value={offer.affiliateUrl || ''}
                          placeholder="Paste your affiliate link here"
                          onChange={(e) => {
                            const newOffers = [...editingProductOffers]; newOffers[idx] = { ...newOffers[idx], affiliateUrl: e.target.value }; setEditingProductOffers(newOffers);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">PUBLISHING</h4>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.published ?? true}
                      onChange={(e) => setEditingProduct({ ...editingProduct, published: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">Published on site</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.featured ?? false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STORE OFFER */}
      {isOfferModalOpen && editingOffer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Configure Store Price</h3>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Retailer / Store *</label>
                <select
                  value={editingOffer.storeId || stores[0]?.id}
                  onChange={(e) => setEditingOffer({ ...editingOffer, storeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Current Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingOffer.price || ''}
                    onChange={(e) =>
                      setEditingOffer({ ...editingOffer, price: Number(e.target.value) })
                    }
                    placeholder="119900"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Original MRP (₹)</label>
                  <input
                    type="number"
                    value={editingOffer.originalPrice || ''}
                    onChange={(e) =>
                      setEditingOffer({ ...editingOffer, originalPrice: Number(e.target.value) })
                    }
                    placeholder="129900"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Affiliate Referral URL</label>
                <input
                  type="url"
                  value={editingOffer.affiliateUrl || ''}
                  onChange={(e) =>
                    setEditingOffer({ ...editingOffer, affiliateUrl: e.target.value })
                  }
                  placeholder="https://amazon.in/dp/...?tag=findora-21"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Shipping & Offer Note</label>
                <input
                  type="text"
                  value={editingOffer.shippingNote || ''}
                  onChange={(e) =>
                    setEditingOffer({ ...editingOffer, shippingNote: e.target.value })
                  }
                  placeholder="Free Next-Day Prime Delivery, ₹5000 HDFC Card off"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Save Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STORE */}
      {isStoreModalOpen && editingStore && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Store Settings</h3>
              <button
                onClick={() => setIsStoreModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Store Name *</label>
                <input
                  type="text"
                  required
                  value={editingStore.name || ''}
                  onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                  placeholder="Amazon India, Vijay Sales..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Domain URL</label>
                <input
                  type="url"
                  value={editingStore.websiteUrl || ''}
                  onChange={(e) => setEditingStore({ ...editingStore, websiteUrl: e.target.value })}
                  placeholder="https://vijaysales.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Affiliate Tag Key</label>
                  <input
                    type="text"
                    value={editingStore.affiliateParamKey || 'tag'}
                    onChange={(e) =>
                      setEditingStore({ ...editingStore, affiliateParamKey: e.target.value })
                    }
                    placeholder="tag or ref"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Default Tag</label>
                  <input
                    type="text"
                    value={editingStore.defaultAffiliateTag || ''}
                    onChange={(e) =>
                      setEditingStore({ ...editingStore, defaultAffiliateTag: e.target.value })
                    }
                    placeholder="findora-21"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Save Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
