import React, { useState, useEffect } from 'react';
import { useFindoraStore } from '../../services/store';
import { ProductDraft, Category, Brand } from '../../types';
import { ArrowLeft, Check, AlertTriangle, Save, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { TEAM_MEMBERS } from '../../config/teamMembers';
import { REQUIRED_DRAFT_FIELDS, getMissingDraftFields, calculateDraftStatus, formatDraftStatus } from '../../utils/drafts';

export const DraftEditor: React.FC<{ draftId: string; onBack: () => void }> = ({ draftId, onBack }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();
  
  const [draft, setDraft] = useState<Partial<ProductDraft> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

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
        merchantId: '',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      store.getDraft(draftId).then(d => {
        if (d) setDraft(d);
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
        const toSave = { ...draft, draftStatus: status, updatedAt: new Date().toISOString() };
        await store.saveDraft(toSave);
        setDraft(toSave);
        setSaveStatus('saved');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [draft, saveStatus]);

  const handleChange = (field: keyof ProductDraft, value: any) => {
    if (!draft) return;
    const updates: Partial<ProductDraft> = { [field]: value };
    
    // Auto-set Amazon merchant
    if (field === 'productUrl' && typeof value === 'string') {
      if (value.includes('amazon.in') || value.includes('amazon.com')) {
        updates.merchantId = 'store-amazon';
      }
    }
    
    setDraft({ ...draft, ...updates });
    setSaveStatus('unsaved');
  };

  const handleAddedByChange = (memberId: string) => {
    const member = TEAM_MEMBERS.find(m => m.id === memberId);
    if (member && draft) {
      setDraft({ ...draft, addedByUserId: member.id, addedBy: member.name });
      setSaveStatus('unsaved');
    }
  };

  if (!draft) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const missingFields = getMissingDraftFields(draft);
  const completionPercent = Math.round(((REQUIRED_DRAFT_FIELDS.length - missingFields.length) / REQUIRED_DRAFT_FIELDS.length) * 100);
  const derivedStatus = calculateDraftStatus(draft);

  // --- HELPER TOOLS ---
  

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
      else if (t.includes('kitchen') || t.includes('cook') || t.includes('fryer')) suggested = 'Kitchen';
      else if (t.includes('watch') || t.includes('smartwatch')) suggested = 'Watches';
      else if (t.includes('router') || t.includes('wifi') || t.includes('networking')) suggested = 'Computers & Accessories';
      else if (t.includes('perfume') || t.includes('fragrance') || t.includes('cologne') || t.includes('beauty')) suggested = 'Beauty & Personal Care';
      
      const foundCategory = categories.find(c => c.name === suggested);
      if (foundCategory) {
        setSuggestedCategory(foundCategory.name);
      } else {
        showToast('No confident category suggestion found. Please select manually.', 'error');
      }
      setIsSuggestingCategory(false);
    }, 800);
  };

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      handleChange('category', suggestedCategory);
      setSuggestedCategory(null);
    }
  };

  const generatePitch = () => {
    if (!draft.title || !draft.brand) {
      showToast('Need Title and Brand to generate pitch', 'error');
      return;
    }
    const txt = `The ${draft.title} from ${draft.brand} is an excellent choice in the ${draft.category || 'electronics'} category, offering premium performance and great value.`;
    handleChange('shortPitch', txt);
    showToast('Generated suggestion', 'success');
  };

  const generateWhy = () => {
    if (!draft.title) {
      showToast('Need Title', 'error');
      return;
    }
    const txt = `Findora picked the ${draft.title} because it provides outstanding quality compared to its price point. We've tracked its pricing to ensure you get the best deal available today.`;
    handleChange('whyFindora', txt);
    showToast('Generated suggestion', 'success');
  };


  const handlePublish = async () => {
    if (missingFields.length > 0) {
      showToast(`Missing required fields: ${missingFields.map(f => f.label).join(', ')}`, 'error');
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
        storeId: draft.merchantId!,
        price: draft.currentPrice!,
        originalPrice: draft.mrp || draft.currentPrice!,
        currency: 'INR',
        affiliateUrl: draft.affiliateUrl!,
        availability: draft.availability!,
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
      
      showToast('Draft published successfully!', 'success');
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
    const toSave = { ...draft, draftStatus: status, updatedAt: new Date().toISOString() };
    await store.saveDraft(toSave);
    setDraft(toSave);
    setSaveStatus('saved');
    showToast('Draft saved manually', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/90 backdrop-blur z-10 py-4 border-b border-slate-200">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Drafts</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-500">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'unsaved' && 'Unsaved changes'}
          </span>
          <button onClick={manualSave} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
            <Save className="w-4 h-4" />
          </button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing || draft.published || derivedStatus !== 'ready_to_publish'}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 font-bold shadow-lg transition-colors"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {draft.published ? 'Published' : 'Publish Product'}
          </button>
        </div>
      </div>
      
      {/* Draft Header Metadata */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-8 items-center">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Added By</label>
          <select 
            value={draft.addedByUserId || ''} 
            onChange={(e) => handleAddedByChange(e.target.value)}
            className="font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
          >
            {TEAM_MEMBERS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
          <div className="font-bold text-slate-900 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            {formatDraftStatus(derivedStatus)}
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion</label>
            <span className="font-bold text-slate-900 text-sm">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
             <div 
                className={`h-full ${completionPercent === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                style={{ width: `${completionPercent}%` }}
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4 lg:col-span-3 flex flex-wrap items-center justify-between">
          <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Assistant Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={suggestCategory} disabled={isSuggestingCategory} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 shadow-sm flex items-center gap-2 disabled:opacity-50">
                {isSuggestingCategory && <Loader2 className="w-3 h-3 animate-spin" />}
                Suggest Category
              </button>
              {suggestedCategory && (
                <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-sm font-medium text-slate-700">Suggested: <strong className="text-blue-700">{suggestedCategory}</strong></span>
                  <button onClick={applySuggestedCategory} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200">Apply</button>
                </div>
              )}
            </div>
            <button onClick={generatePitch} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 shadow-sm">
              Generate Pitch
            </button>
            <button onClick={generateWhy} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 shadow-sm">
              Generate Why Picked It
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Core Product Info</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={draft.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="e.g. Sony WH-1000XM5 Noise Cancelling Headphones"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    list="brands"
                    value={draft.brand || ''}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                    placeholder="Search brand..."
                  />
                  <datalist id="brands">
                    {brands.map(b => <option key={b.id} value={b.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    list="categories"
                    value={draft.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                    placeholder="Search category..."
                  />
                  <datalist id="categories">
                    {categories.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Original Product URL</label>
                <input
                  type="url"
                  value={draft.productUrl || ''}
                  onChange={(e) => handleChange('productUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="https://amazon.in/dp/..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Main Image URL</label>
                <input
                  type="url"
                  value={draft.image || ''}
                  onChange={(e) => handleChange('image', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Pricing & Offer</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Current Price (₹)</label>
                <input
                  type="number"
                  value={draft.currentPrice || ''}
                  onChange={(e) => handleChange('currentPrice', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={draft.mrp || ''}
                  onChange={(e) => handleChange('mrp', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Merchant Store ID</label>
                <input
                  type="text"
                  value={draft.merchantId || ''}
                  onChange={(e) => handleChange('merchantId', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="store-amazon, store-flipkart..."                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Availability</label>
                <select
                  value={draft.availability || 'in_stock'}
                  onChange={(e) => handleChange('availability', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="limited_stock">Limited Stock</option>
                  <option value="pre_order">Pre-Order</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl shadow-sm">
            <label className="block text-sm font-bold text-blue-900 mb-1">Affiliate URL (Required for Publish)</label>
            <p className="text-xs text-blue-700 mb-3">Can be left blank while drafting. Add before publishing.</p>
            <input
              type="url"
              value={draft.affiliateUrl || ''}
              onChange={(e) => handleChange('affiliateUrl', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white"
              placeholder="https://amazon.in/dp/...?tag=findora-21"
            />
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Editorial & Content</h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Short Pitch</label>
              <textarea
                value={draft.shortPitch || ''}
                onChange={(e) => handleChange('shortPitch', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Why Findora Picked It</label>
              <textarea
                value={draft.whyFindora || ''}
                onChange={(e) => handleChange('whyFindora', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none min-h-[120px]"
              />
            </div>
          </div>
          
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Publishing Checklist</h3>
            
            <div className="space-y-2 mt-4">
              <ul className="space-y-2 text-sm">
                {REQUIRED_DRAFT_FIELDS.map(f => {
                  const val = (draft as any)[f.key];
                  const isMissing = val === null || val === undefined || val === '';
                  return (
                    <li key={f.key} className="flex items-center gap-2">
                      {isMissing ? (
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                           <span className="text-[10px]">✕</span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <span className={isMissing ? 'text-slate-500' : 'text-slate-900 font-medium'}>{f.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {missingFields.length > 0 ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-sm text-orange-800 mt-4">
                <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500" />
                <p>Complete <strong>{missingFields.length} required fields</strong> before publishing.</p>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-sm text-green-800 mt-4">
                <Check className="w-5 h-5 shrink-0 text-green-600" />
                <p>Ready to publish! All required fields are present.</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p>Created: {new Date(draft.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
