import re

with open("firestore.rules", "r") as f:
    content = f.read()

# Append rules before the last closing brace
new_rules = """
    // --- PRODUCT DRAFTS ---
    match /productDrafts/{draftId} {
      allow read: if isEditor();
      allow create: if isEditor();
      allow update: if isEditor();
      allow delete: if isAdmin();
    }
    
    // --- BRANDS ---
    match /brands/{brandId} {
      allow read: if true;
      allow create: if isEditor();
      allow update: if isEditor();
      allow delete: if isAdmin();
    }
    
    // --- CATEGORIES ---
    match /categories/{categoryId} {
      allow read: if true;
      allow create: if isEditor();
      allow update: if isEditor();
      allow delete: if isAdmin();
    }
"""

content = content.replace("  }\n}", new_rules + "  }\n}")

with open("firestore.rules", "w") as f:
    f.write(content)
