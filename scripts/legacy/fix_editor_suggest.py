with open("src/pages/admin/DraftEditor.tsx", "r") as f:
    content = f.read()

old_suggest = """      const t = (draft.title + ' ' + draft.shortPitch + ' ' + draft.brand).toLowerCase();
      let suggested = '';
      if (t.includes('phone') || t.includes('iphone') || t.includes('galaxy') || t.includes('mobile')) suggested = 'Mobiles & Accessories';
      else if (t.includes('headphone') || t.includes('earbud') || t.includes('audio') || t.includes('speaker')) suggested = 'Audio';
      else if (t.includes('tv') || t.includes('television')) suggested = 'TV & Home Entertainment';
      else if (t.includes('laptop') || t.includes('macbook') || t.includes('computer')) suggested = 'Computers & Accessories';
      else if (t.includes('kitchen') || t.includes('cook') || t.includes('fryer')) suggested = 'Kitchen';
      else if (t.includes('watch') || t.includes('smartwatch')) suggested = 'Watches';
      else if (t.includes('router') || t.includes('wifi') || t.includes('networking')) suggested = 'Computers & Accessories';"""

new_suggest = """      const t = ((draft.title || '') + ' ' + (draft.shortPitch || '') + ' ' + (draft.brand || '')).toLowerCase();
      let suggested = '';
      if (t.includes('phone') || t.includes('iphone') || t.includes('galaxy') || t.includes('mobile')) suggested = 'Mobiles & Accessories';
      else if (t.includes('headphone') || t.includes('earbud') || t.includes('audio') || t.includes('speaker')) suggested = 'Audio';
      else if (t.includes('tv') || t.includes('television')) suggested = 'TV & Home Entertainment';
      else if (t.includes('laptop') || t.includes('macbook') || t.includes('computer')) suggested = 'Computers & Accessories';
      else if (t.includes('kitchen') || t.includes('cook') || t.includes('fryer')) suggested = 'Kitchen';
      else if (t.includes('watch') || t.includes('smartwatch')) suggested = 'Watches';
      else if (t.includes('router') || t.includes('wifi') || t.includes('networking')) suggested = 'Computers & Accessories';
      else if (t.includes('perfume') || t.includes('fragrance') || t.includes('cologne') || t.includes('beauty')) suggested = 'Beauty';"""

content = content.replace(old_suggest, new_suggest)

with open("src/pages/admin/DraftEditor.tsx", "w") as f:
    f.write(content)
