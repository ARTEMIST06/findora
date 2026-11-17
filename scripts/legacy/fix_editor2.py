import re

with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

publish_logic = """
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
      
      const auth = await import('firebase/auth').then(m => m.getAuth());
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        showToast('Could not get authentication token', 'error');
        setIsPublishing(false);
        return;
      }
      
      const res = await fetch('/api/publish-draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ draft })
      });
      
      const data = await res.json();
      if (data.success) {
        showToast('Product successfully published!', 'success');
        onBack();
      } else {
        showToast(data.message || 'Error publishing product', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error publishing product', 'error');
    }
    setIsPublishing(false);
  };
"""

content = re.sub(r'  const handlePublish = async \(\) => \{.*?(?=  const manualSave = async \(\) => \{)', publish_logic + '\n', content, flags=re.DOTALL)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)
