import re

with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

helpers = """
  // --- HELPER TOOLS ---
  const handleFetchInfo = async () => {
    if (!draft.productUrl || !draft.merchantId) {
      showToast('Need Product URL and Merchant ID first', 'error');
      return;
    }
    showToast('Fetching product info...', 'success');
    try {
      const res = await fetch('/api/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: draft.productUrl, merchantId: draft.merchantId })
      });
      const data = await res.json();
      if (data.success && data.product) {
        setDraft({
          ...draft,
          title: draft.title || data.product.name || '',
          brand: draft.brand || data.product.brand || '',
          image: draft.image || (data.product.images && data.product.images[0]) || '',
          currentPrice: draft.currentPrice || data.product.currentPrice || null,
          merchantProductId: draft.merchantProductId || data.product.merchantProductId || ''
        });
        setSaveStatus('unsaved');
        showToast('Info fetched successfully', 'success');
      } else {
        showToast('Failed to fetch info: ' + (data.message || ''), 'error');
      }
    } catch (e) {
      showToast('Error fetching info', 'error');
    }
  };

  const suggestCategory = () => {
    if (!draft.title) {
      showToast('Need product title first', 'error');
      return;
    }
    const t = draft.title.toLowerCase();
    let suggested = '';
    if (t.includes('phone') || t.includes('iphone') || t.includes('galaxy')) suggested = 'Mobiles & Accessories';
    else if (t.includes('headphone') || t.includes('earbud') || t.includes('audio')) suggested = 'Audio';
    else if (t.includes('tv') || t.includes('television')) suggested = 'TV & Home Entertainment';
    else if (t.includes('laptop') || t.includes('macbook')) suggested = 'Computers & Accessories';
    else suggested = 'Electronics';

    if (confirm(`Suggesting Category: ${suggested}. Apply?`)) {
      handleChange('category', suggested);
    }
  };

  const generatePitch = () => {
    if (!draft.title || !draft.brand) {
      showToast('Need Title and Brand', 'error');
      return;
    }
    const txt = `The ${draft.title} from ${draft.brand} is an excellent choice in the ${draft.category || 'electronics'} category, offering premium performance and great value.`;
    handleChange('shortPitch', txt);
  };

  const generateWhy = () => {
    if (!draft.title) {
      showToast('Need Title', 'error');
      return;
    }
    const txt = `Findora picked the ${draft.title} because it provides outstanding quality compared to its price point. We've tracked its pricing to ensure you get the best deal available today.`;
    handleChange('whyFindora', txt);
  };
"""

content = content.replace("  const manualSave = async () => {", helpers + "\n  const manualSave = async () => {")

buttons = """
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Assistant Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleFetchInfo} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 shadow-sm">
              Fetch Product Info
            </button>
            <button onClick={suggestCategory} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 shadow-sm">
              Suggest Category
            </button>
            <button onClick={generatePitch} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 shadow-sm">
              Generate Pitch
            </button>
            <button onClick={generateWhy} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 shadow-sm">
              Generate Why Picked It
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-8">
"""

content = content.replace('<div className="lg:col-span-2 space-y-8">', buttons)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)
