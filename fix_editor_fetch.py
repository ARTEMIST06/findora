with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

old_fetch = """        if (data.product.name) {
          if (!draft.title || confirm(`Fetched title: "${data.product.name}". Apply?`)) {
            updates.title = data.product.name;
          }
        }
        if (data.product.brand) {
           if (!draft.brand || confirm(`Fetched brand: "${data.product.brand}". Apply?`)) {
             updates.brand = data.product.brand;
           }
        }
        if (data.product.images && data.product.images[0]) {
           if (!draft.image || confirm(`Fetched image found. Apply?`)) {
             updates.image = data.product.images[0];
           }
        }
        if (data.product.merchantProductId && !draft.merchantProductId) {
           updates.merchantProductId = data.product.merchantProductId;
        }
        
        if (Object.keys(updates).length > 0) {"""

new_fetch = """        if (data.product.name && !draft.title) updates.title = data.product.name;
        else if (data.product.name && draft.title !== data.product.name) {
            if (confirm(`Fetched title: "${data.product.name}". Apply?`)) updates.title = data.product.name;
        }

        if (data.product.brand && !draft.brand) updates.brand = data.product.brand;
        else if (data.product.brand && draft.brand !== data.product.brand) {
            if (confirm(`Fetched brand: "${data.product.brand}". Apply?`)) updates.brand = data.product.brand;
        }

        if (data.product.images && data.product.images[0] && !draft.image) updates.image = data.product.images[0];
        else if (data.product.images && data.product.images[0] && draft.image !== data.product.images[0]) {
            if (confirm(`Fetched image found. Apply?`)) updates.image = data.product.images[0];
        }

        if (data.product.merchantProductId && !draft.merchantProductId) {
           updates.merchantProductId = data.product.merchantProductId;
        }
        
        if (Object.keys(updates).length > 0) {"""

content = content.replace(old_fetch, new_fetch)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)
