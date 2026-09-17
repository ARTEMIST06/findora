const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/DraftEditor.tsx', 'utf8');

const regex = /setIsPublishing\(true\);\s*try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}\s*setIsPublishing\(false\);/;

const newHandlePublish = `
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
      
      const productId = \`prod_\${Date.now()}\`;
      const offerId = \`off_\${Date.now()}\`;
      
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
`;

if (regex.test(content)) {
  content = content.replace(regex, newHandlePublish.trim());
  fs.writeFileSync('src/pages/admin/DraftEditor.tsx', content);
  console.log('Patched DraftEditor');
} else {
  console.error('Regex failed to match');
}
