with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

old_change = """  const handleChange = (field: keyof ProductDraft, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
    setSaveStatus('unsaved');
  };"""

new_change = """  const handleChange = (field: keyof ProductDraft, value: any) => {
    if (!draft) return;
    const updates: Partial<ProductDraft> = { [field]: value };
    
    // Auto-set Amazon merchant
    if (field === 'productUrl' && typeof value === 'string') {
      if (value.includes('amazon.in') || value.includes('amazon.com')) {
        updates.merchantId = 'amazon';
      }
    }
    
    setDraft({ ...draft, ...updates });
    setSaveStatus('unsaved');
  };"""

content = content.replace(old_change, new_change)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)
