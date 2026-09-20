import React, { useState, useEffect } from 'react';
import { useFindoraStore } from '../../services/store';
import { ProductDraft, Category, Brand } from '../../types';
import { 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  Save, 
  Loader2, 
  Sparkles, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { TEAM_MEMBERS } from '../../config/teamMembers';
import { REQUIRED_DRAFT_FIELDS, getMissingDraftFields, calculateDraftStatus, formatDraftStatus } from '../../utils/drafts';
import { OpenAmazonButton } from '../../components/admin/OpenAmazonButton';
import { validateAmazonAffiliateUrl, isAmazonUrl } from '../../utils/amazon';

export const DraftEditor: React.FC<{ draftId: string; onBack: () => void }> = ({ draftId, onBack }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();
  
  const [draft, setDraft] = useState<Partial<ProductDraft> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // AI and Manual Edit Protection State
  const [manualEdits, setManualEdits] = useState<Record<string, boolean>>({});
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [lastGeneratedHash, setLastGeneratedHash] = useState<string | null>(null);

  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  // New item inputs for Pros & Cons
  const [newProText, setNewProText] = useState('');
  const [newConText, setNewConText] = useState('');

  useEffect(() => {
    store.fetchCategories().then(setCategories);
    store.getBrands().then(setBrands);
    
    if (draftId === 'new') {
      const user = store.getCurrentUser();
      const matchedMember = TEAM_MEMBERS.find(m => m.id === user?.id) || TEAM_MEMBERS[0];
      setDraft({
        id: 'draft_' + Date.now().toString(),
        title: '',
        brand: '',
        category: '',
        productUrl: '',
        affiliateUrl: '',
        merchantId: 'store-amazon',
        merchantProductId: '',
        image: '',
        currentPrice: null,
        mrp: null,
        availability: 'in_stock',
        badge: '',
        shortPitch: '',
        whyFindora: '',
        pros: [],
        cons: [],
        specifications: {},
        published: false,
        featured: false,
        addedBy: matchedMember.name,
        addedByUserId: matchedMember.id,
        draftStatus: 'incomplete',
        manualEdits: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      store.getDraft(draftId).then(d => {
        if (d) {
          setDraft(d);
          if (d.manualEdits) {
            setManualEdits(d.manualEdits);
          }
          if (d.lastGeneratedHash) {
            setLastGeneratedHash(d.lastGeneratedHash);
          }
        }
      });
    }
  }, [draftId]);

  // Auto-save logic
  useEffect(() => {
    if (!draft || draftId === 'new') return; // For new drafts, wait for first edit to save
    if (saveStatus === 'unsaved') {
      const timer = setTimeout(async () => {
        setSaveStatus('saving');
        const status = calculateDraftStatus(draft);
        const toSave = { 
          ...draft, 
          draftStatus: status, 
          manualEdits,
          lastGeneratedHash,
          updatedAt: new Date().toISOString() 
        };
        await store.saveDraft(toSave);
        setDraft(toSave);
        setSaveStatus('saved');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [draft, saveStatus, manualEdits, lastGeneratedHash]);

  const handleChange = (field: keyof ProductDraft, value: any, isManualUserEdit = false) => {
    if (!draft) return;
    const updates: Partial<ProductDraft> = { [field]: value };
    
    // Auto-set Amazon merchant
    if (field === 'productUrl' && typeof value === 'string') {
      if (value.includes('amazon.in') || value.includes('amazon.com')) {
        updates.merchantId = 'store-amazon';
      }
    }

    if (isManualUserEdit) {
      setManualEdits(prev => {
        const next = { ...prev, [field]: true };
        return next;
      });
    }
    
    setDraft(prev => prev ? { ...prev, ...updates } : prev);
    setSaveStatus('unsaved');
  };

  const handleAddedByChange = (memberId: string) => {
    const member = TEAM_MEMBERS.find(m => m.id === memberId);
    if (member && draft) {
      setDraft({ ...draft, addedByUserId: member.id, addedBy: member.name });
      setSaveStatus('unsaved');
    }
  };

  // --- AI CONTENT GENERATION ---
  const generateAllAiContent = async (options: { forceAll?: boolean } = {}) => {
    if (!draft || !draft.title || draft.title.trim().length < 3) {
      if (options.forceAll) {
        showToast('Please enter a product title with at least 3 characters', 'error');
      }
      return;
    }

    setIsGeneratingAi(true);
    setAiStatusMessage('Generating AI editorial content...');

    try {
      const res = await fetch('/api/generate-product-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: draft.brand || '',
          title: draft.title,
          shortPitch: draft.shortPitch || '',
          category: draft.category || ''
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        const updates: Partial<ProductDraft> = {};
        const newManualEdits = { ...manualEdits };

        // 1. whyFindora: protect manual edits unless forceAll
        if (options.forceAll || (!manualEdits.whyFindora && (!draft.whyFindora || draft.whyFindora.includes('[AI suggestion')))) {
          updates.whyFindora = data.whyWePickedIt;
          if (options.forceAll) delete newManualEdits.whyFindora;
        }

        // 2. badge: protect manual edits unless forceAll
        if (options.forceAll || (!manualEdits.badge && !draft.badge)) {
          updates.badge = data.topPick;
          if (options.forceAll) delete newManualEdits.badge;
        }

        // 3. pros: protect manual edits unless forceAll
        if (options.forceAll || (!manualEdits.pros && (!draft.pros || draft.pros.length === 0))) {
          updates.pros = data.pros;
          if (options.forceAll) delete newManualEdits.pros;
        }

        // 4. cons: protect manual edits unless forceAll
        if (options.forceAll || (!manualEdits.cons && (!draft.cons || draft.cons.length === 0))) {
          updates.cons = data.cons;
          if (options.forceAll) delete newManualEdits.cons;
        }

        // 5. shortPitch (if empty or forceAll)
        if (options.forceAll || (!manualEdits.shortPitch && !draft.shortPitch)) {
          updates.shortPitch = data.shortSeoDescription;
          if (options.forceAll) delete newManualEdits.shortPitch;
        }

        // 6. suggested category (if empty)
        if (!draft.category && data.suggestedCategory) {
          const matched = categories.find(
            c => c.name.toLowerCase() === data.suggestedCategory.toLowerCase() ||
                 c.slug.toLowerCase() === data.suggestedCategory.toLowerCase()
          );
          if (matched) {
            updates.category = matched.name;
          }
        }

        const newHash = `${(draft.brand || '').trim()}::${draft.title.trim()}::${(draft.shortPitch || '').trim()}`;
        setLastGeneratedHash(newHash);
        setManualEdits(newManualEdits);

        setDraft(prev => prev ? {
          ...prev,
          ...updates,
          manualEdits: newManualEdits,
          lastGeneratedHash: newHash,
          generatedAt: new Date().toISOString()
        } : prev);

        setSaveStatus('unsaved');
        setAiStatusMessage('✓ AI content generated');
        showToast(options.forceAll ? '✨ AI content refreshed!' : '✓ AI content populated for empty fields', 'success');
      } else {
        setAiStatusMessage('AI generation failed');
        showToast(json.message || 'Failed to generate content', 'error');
      }
    } catch (err: any) {
      console.error("AI generation failed:", err);
      setAiStatusMessage('AI generation failed');
      showToast('Could not reach generation service', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Debounced auto-generation effect when Brand + Title are entered
  useEffect(() => {
    if (!draft) return;
    const title = (draft.title || '').trim();
    const brand = (draft.brand || '').trim();

    // Trigger auto-suggest when title and brand are defined
    if (title.length < 5 || brand.length < 2) return;

    const currentHash = `${brand}::${title}::${(draft.shortPitch || '').trim()}`;
    if (currentHash === lastGeneratedHash || currentHash === draft.lastGeneratedHash) return;

    // If all key editorial fields are already protected manual edits, don't auto-run
    if (manualEdits.whyFindora && manualEdits.badge && manualEdits.pros && manualEdits.cons) return;

    const timer = setTimeout(() => {
      generateAllAiContent({ forceAll: false });
    }, 1400);

    return () => clearTimeout(timer);
  }, [draft?.title, draft?.brand, draft?.shortPitch]);

  if (!draft) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const missingFields = getMissingDraftFields(draft);
  const completionPercent = Math.round(((REQUIRED_DRAFT_FIELDS.length - missingFields.length) / REQUIRED_DRAFT_FIELDS.length) * 100);
  const derivedStatus = calculateDraftStatus(draft);
  const affiliateValidation = validateAmazonAffiliateUrl(draft.affiliateUrl);

  // --- Category Suggestion ---
  const suggestCategory = () => {
    setIsSuggestingCategory(true);
    setSuggestedCategory(null);
    
    setTimeout(() => {
      const t = ((draft.title || '') + ' ' + (draft.shortPitch || '') + ' ' + (draft.brand || '')).toLowerCase();
      let suggested = '';
      if (t.includes('phone') || t.includes('iphone') || t.includes('galaxy') || t.includes('mobile')) suggested = 'Mobiles & Accessories';
      else if (t.includes('headphone') || t.includes('earbud') || t.includes('audio') || t.includes('speaker')) suggested = 'Audio';
      else if (t.includes('tv') || t.includes('television')) suggested = 'TV & Home Entertainment';
      else if (t.includes('laptop') || t.includes('macbook') || t.includes('computer')) suggested = 'Computers & Accessories';
      else if (t.includes('kitchen') || t.includes('cook') || t.includes('fryer') || t.includes('oven')) suggested = 'Kitchen';
      else if (t.includes('watch') || t.includes('smartwatch')) suggested = 'Watches';
      else if (t.includes('perfume') || t.includes('fragrance') || t.includes('beauty') || t.includes('cosmetic')) suggested = 'Beauty & Personal Care';
      
      const foundCategory = categories.find(c => c.name === suggested);
      if (foundCategory) {
        setSuggestedCategory(foundCategory.name);
      } else {
        showToast('No confident category suggestion found. Please select manually.', 'error');
      }
      setIsSuggestingCategory(false);
    }, 600);
  };

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      handleChange('category', suggestedCategory, true);
      setSuggestedCategory(null);
    }
  };

  // --- Pros & Cons list management ---
  const addPro = () => {
    if (!newProText.trim()) return;
    const updated = [...(draft.pros || []), newProText.trim()];
    handleChange('pros', updated, true);
    setNewProText('');
  };

  const removePro = (index: number) => {
    const updated = (draft.pros || []).filter((_, i) => i !== index);
    handleChange('pros', updated, true);
  };

  const addCon = () => {
    if (!newConText.trim()) return;
    const updated = [...(draft.cons || []), newConText.trim()];
    handleChange('cons', updated, true);
    setNewConText('');
  };

  const removeCon = (index: number) => {
    const updated = (draft.cons || []).filter((_, i) => i !== index);
    handleChange('cons', updated, true);
  };

  const handlePublish = async () => {
    if (missingFields.length > 0) {
      showToast(`Missing required fields: ${missingFields.map(f => f.label).join(', ')}`, 'error');
      return;
    }

    if (!affiliateValidation.isValid) {
      showToast(`Invalid Affiliate URL: ${affiliateValidation.message}`, 'error');
      return;
    }
    
    setIsPublishing(true);
    try {
      const user = store.getCurrentUser();
      if (!user) {
        showToast('Not authenticated', 'error');
        setIsPublishing(false);
        return;
      }
      
      const { db } = await import('../../lib/firebase');
      const { doc, writeBatch } = await import('firebase/firestore');
      
      const productId = `prod_${Date.now()}`;
      const offerId = `off_${Date.now()}`;
      
      const product = {
        id: productId,
        slug: draft.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
        name: draft.title!,
        brand: draft.brand!,
        category: draft.category!,
        shortDescription: (draft.shortPitch || '').replace('[AI suggestion — review before saving]', '').trim(),
        description: (draft.whyFindora || '').replace('[AI suggestion — review before saving]', '').trim(),
        images: [draft.image!],
        specifications: draft.specifications || {},
        pros: draft.pros || [],
        cons: draft.cons || [],
        whyFindora: (draft.whyFindora || '').replace('[AI suggestion — review before saving]', '').trim(),
        tags: [],
        published: true,
        featured: draft.featured || false,
        badge: draft.badge || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const offer = {
        id: offerId,
        productId,
        storeId: draft.merchantId || 'store-amazon',
        price: draft.currentPrice!,
        originalPrice: draft.mrp || draft.currentPrice!,
        currency: 'INR',
        affiliateUrl: draft.affiliateUrl!,
        availability: draft.availability || 'in_stock',
        lastUpdated: new Date().toISOString(),
        sourceType: 'manual',
        merchantProductId: draft.merchantProductId || '',
        productUrl: draft.productUrl || ''
      };
      
      const finalDraft = {
        ...draft,
        draftStatus: 'published',
        published: true,
        publishedAt: new Date().toISOString(),
        publishedBy: user.id,
        updatedAt: new Date().toISOString()
      };
      
      const batch = writeBatch(db);
      batch.set(doc(db, "products", productId), product);
      batch.set(doc(db, "offers", offerId), offer);
      batch.set(doc(db, "productDrafts", draft.id!), finalDraft, { merge: true });
      
      await batch.commit();
      
      showToast('Draft published successfully! Live in store.', 'success');
      onBack();
    } catch (e: any) {
      console.error("[CLIENT] Publish draft error:", e);
      showToast(e.message || 'Failed to publish draft', 'error');
    }
    setIsPublishing(false);
  };

  const manualSave = async () => {
    setSaveStatus('saving');
    const status = calculateDraftStatus(draft);
    const toSave = { 
      ...draft, 
      draftStatus: status, 
      manualEdits,
      lastGeneratedHash,
      updatedAt: new Date().toISOString() 
    };
    await store.saveDraft(toSave);
    setDraft(toSave);
    setSaveStatus('saved');
    showToast('Draft saved manually', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 py-4 border-b border-slate-200">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Back to Drafts</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Direct Open Amazon action in top bar */}
          <OpenAmazonButton url={draft.productUrl} size="sm" />

          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'unsaved' && 'Unsaved changes'}
          </span>

          <button 
            onClick={manualSave} 
            title="Save draft"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 shadow-2xs"
          >
            <Save className="w-4 h-4" />
          </button>

          <button 
            onClick={handlePublish}
            disabled={isPublishing || draft.published || derivedStatus !== 'ready_to_publish'}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 font-bold text-sm shadow-md transition-all"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {draft.published ? 'Published' : 'Publish Product'}
          </button>
        </div>
      </div>
      
      {/* Draft Header Metadata */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-6 items-center">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Added By</label>
          <select 
            value={draft.addedByUserId || ''} 
            onChange={(e) => handleAddedByChange(e.target.value)}
            className="font-bold text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
          >
            {TEAM_MEMBERS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
          <div className="font-bold text-xs text-slate-900 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            {formatDraftStatus(derivedStatus)}
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completion</label>
            <span className="font-bold text-slate-900 text-xs">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
             <div 
                className={`h-full transition-all duration-300 ${completionPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                style={{ width: `${completionPercent}%` }}
             />
          </div>
        </div>
      </div>

      {/* AI Assistant & Automation Bar */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-5 rounded-3xl border border-blue-100 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Findora Content Copilot
                {isGeneratingAi && (
                  <span className="text-xs text-blue-600 font-normal flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating editorial content...
                  </span>
                )}
                {!isGeneratingAi && aiStatusMessage && (
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {aiStatusMessage}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Auto-suggests Why Findora Picked It, Badges, Pros & Cons. Manual edits are always protected.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => generateAllAiContent({ forceAll: true })}
              disabled={isGeneratingAi || !draft.title}
              title="Force regenerate all AI fields (will refresh why, badge, pros, cons)"
              className="px-3.5 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-50 shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              {isGeneratingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              ✨ Regenerate AI Content
            </button>

            <button 
              onClick={suggestCategory} 
              disabled={isSuggestingCategory} 
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSuggestingCategory ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-blue-500" />}
              Suggest Category
            </button>

            {suggestedCategory && (
              <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-2.5 py-1 shadow-2xs">
                <span className="text-xs text-slate-700">Category: <strong className="text-blue-700">{suggestedCategory}</strong></span>
                <button 
                  onClick={applySuggestedCategory} 
                  className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Core Info & Amazon Offer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Core Product Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Core Product Details</span>
              <span className="text-xs font-normal text-slate-400">Step 1</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={draft.title || ''}
                  onChange={(e) => handleChange('title', e.target.value, true)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium text-slate-900 transition-all"
                  placeholder="e.g. Sony WH-1000XM5 Wireless Noise Cancelling Headphones"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Brand *
                  </label>
                  <input
                    type="text"
                    list="brands"
                    value={draft.brand || ''}
                    onChange={(e) => handleChange('brand', e.target.value, true)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900"
                    placeholder="e.g. Sony, Apple, Samsung"
                  />
                  <datalist id="brands">
                    {brands.map(b => <option key={b.id} value={b.name} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    list="categories"
                    value={draft.category || ''}
                    onChange={(e) => handleChange('category', e.target.value, true)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900"
                    placeholder="e.g. Audio, Mobiles, Kitchen"
                  />
                  <datalist id="categories">
                    {categories.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Main Image URL *
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={draft.image || ''}
                    onChange={(e) => handleChange('image', e.target.value, true)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900"
                    placeholder="https://images-na.ssl-images-amazon.com/images/..."
                  />
                  {draft.image && (
                    <img 
                      src={draft.image} 
                      alt="Preview" 
                      className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white shrink-0" 
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Amazon Store & Direct Open / Affiliate Workflow */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Amazon Store & Affiliate Linking</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 rounded-md">
                    Fast Track
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Open the Amazon product page directly, generate your affiliate link, and paste below.
                </p>
              </div>
              <OpenAmazonButton url={draft.productUrl} size="md" />
            </div>

            {/* Amazon Product URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Amazon Product URL *
                </label>
                {draft.productUrl && isAmazonUrl(draft.productUrl) && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Valid Amazon Link
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={draft.productUrl || ''}
                  onChange={(e) => handleChange('productUrl', e.target.value, true)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs font-mono text-slate-800"
                  placeholder="https://www.amazon.in/dp/B0..."
                />
                <OpenAmazonButton url={draft.productUrl} size="sm" />
              </div>
            </div>

            {/* Amazon Affiliate URL */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  Amazon Affiliate URL *
                  <span className="text-[11px] font-normal text-amber-800 normal-case">(Required to publish)</span>
                </label>

                {affiliateValidation.isValid && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3 text-emerald-600" /> Affiliate link added
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={draft.affiliateUrl || ''}
                  onChange={(e) => handleChange('affiliateUrl', e.target.value, true)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border outline-none text-xs font-mono bg-white transition-all ${
                    affiliateValidation.isValid
                      ? 'border-emerald-400 focus:border-emerald-500 ring-2 ring-emerald-50 text-slate-900'
                      : draft.affiliateUrl
                      ? 'border-amber-400 focus:border-amber-500 text-slate-900'
                      : 'border-slate-200 focus:border-blue-500 text-slate-900'
                  }`}
                  placeholder="Paste generated affiliate link here (e.g. https://amzn.to/... or https://amazon.in/dp/...?tag=...)"
                />
                {draft.affiliateUrl && (
                  <a
                    href={draft.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Test affiliate link in new tab"
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    Test Link
                  </a>
                )}
              </div>

              {draft.affiliateUrl && !affiliateValidation.isValid && (
                <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {affiliateValidation.message}
                </p>
              )}

              {!draft.affiliateUrl && (
                <p className="text-[11px] text-amber-800/80 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Click <strong>Open Amazon</strong> above, generate your SiteStripe affiliate link on Amazon, then paste it here.
                </p>
              )}
            </div>

            {/* Pricing & Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Price (₹) *
                </label>
                <input
                  type="number"
                  value={draft.currentPrice ?? ''}
                  onChange={(e) => handleChange('currentPrice', e.target.value === '' ? null : Number(e.target.value), true)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-bold text-slate-900"
                  placeholder="e.g. 24990"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  value={draft.mrp ?? ''}
                  onChange={(e) => handleChange('mrp', e.target.value === '' ? null : Number(e.target.value), true)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900"
                  placeholder="e.g. 29990"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Stock Status *
                </label>
                <select
                  value={draft.availability || 'in_stock'}
                  onChange={(e) => handleChange('availability', e.target.value, true)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-white text-xs font-bold text-slate-800"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="limited_stock">Limited Stock</option>
                  <option value="pre_order">Pre-Order</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Editorial & Content (AI + Protected Manual Edits) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Editorial & Discovery Content</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Findora recommendation highlights and buyer value considerations.
                </p>
              </div>
              <button
                onClick={() => generateAllAiContent({ forceAll: true })}
                disabled={isGeneratingAi || !draft.title}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                Refine with AI
              </button>
            </div>

            {/* Badge Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Editorial Badge
                  {manualEdits.badge ? (
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                      Manual (protected)
                    </span>
                  ) : draft.badge ? (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI generated
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {['Top Pick', "Editor's Choice", 'Best Value', 'Flagship Pick', 'Budget King', 'Trending Deal'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleChange('badge', b, true)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      draft.badge === b
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={draft.badge || ''}
                onChange={(e) => handleChange('badge', e.target.value, true)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-xs text-slate-900"
                placeholder="Or type custom badge..."
              />
            </div>

            {/* Short Pitch */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Short Pitch
                  {manualEdits.shortPitch ? (
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                      Manual (protected)
                    </span>
                  ) : draft.shortPitch ? (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI generated
                    </span>
                  ) : null}
                </label>
              </div>
              <textarea
                value={draft.shortPitch || ''}
                onChange={(e) => handleChange('shortPitch', e.target.value, true)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-800 min-h-[70px]"
                placeholder="Crisp 1-sentence product summary (e.g. Flagship wireless headphones featuring industry-leading ANC)"
              />
            </div>

            {/* Why Findora Picked It */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Why Findora Picked It
                  {manualEdits.whyFindora ? (
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                      Manual (protected)
                    </span>
                  ) : draft.whyFindora ? (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI generated
                    </span>
                  ) : null}
                </label>
              </div>
              <textarea
                value={draft.whyFindora || ''}
                onChange={(e) => handleChange('whyFindora', e.target.value, true)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-800 min-h-[100px]"
                placeholder="Editorial reasoning on why this product is recommended..."
              />
            </div>

            {/* Pros */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Product Pros
                  {manualEdits.pros ? (
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                      Manual (protected)
                    </span>
                  ) : (draft.pros && draft.pros.length > 0) ? (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI generated
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="space-y-2 mb-2">
                {(draft.pros || []).map((pro, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <input
                      type="text"
                      value={pro}
                      onChange={(e) => {
                        const updated = [...(draft.pros || [])];
                        updated[index] = e.target.value;
                        handleChange('pros', updated, true);
                      }}
                      className="flex-1 bg-transparent text-xs text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removePro(index)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProText}
                  onChange={(e) => setNewProText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPro(); }}}
                  placeholder="Add a pro point..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addPro}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Cons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Product Cons / Trade-offs
                  {manualEdits.cons ? (
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                      Manual (protected)
                    </span>
                  ) : (draft.cons && draft.cons.length > 0) ? (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI generated
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="space-y-2 mb-2">
                {(draft.cons || []).map((con, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <input
                      type="text"
                      value={con}
                      onChange={(e) => {
                        const updated = [...(draft.cons || [])];
                        updated[index] = e.target.value;
                        handleChange('cons', updated, true);
                      }}
                      className="flex-1 bg-transparent text-xs text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeCon(index)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConText}
                  onChange={(e) => setNewConText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCon(); }}}
                  placeholder="Add a trade-off or con point..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addCon}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Publishing Checklist & Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 sticky top-24">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Publishing Readiness</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                missingFields.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {missingFields.length === 0 ? 'Ready' : `${missingFields.length} missing`}
              </span>
            </h3>
            
            <ul className="space-y-2 text-xs">
              {REQUIRED_DRAFT_FIELDS.map(f => {
                const val = (draft as any)[f.key];
                const isMissing = val === null || val === undefined || val === '';
                return (
                  <li key={f.key} className="flex items-center gap-2">
                    {isMissing ? (
                      <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                         <span className="text-[9px]">✕</span>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                    <span className={isMissing ? 'text-slate-400' : 'text-slate-800 font-medium'}>
                      {f.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            
            {missingFields.length > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 mt-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p>Complete <strong>{missingFields.length} required fields</strong> before publishing to store.</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 mt-3">
                <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <p className="font-semibold">All fields validated! Ready to publish to Findora store.</p>
              </div>
            )}

            {/* Quick Amazon Link Card in Sidebar */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Action
              </span>
              <OpenAmazonButton url={draft.productUrl} size="md" className="w-full justify-center" />
            </div>
            
            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p>Draft ID: <span className="font-mono">{draft.id}</span></p>
              <p>Created: {new Date(draft.createdAt || Date.now()).toLocaleDateString()}</p>
              {draft.generatedAt && (
                <p className="text-blue-600">AI generated: {new Date(draft.generatedAt).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
