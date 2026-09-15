with open('firestore.rules', 'r') as f:
    code = f.read()

history_rules = """
    // --- PRICE HISTORY ---
    match /priceHistory/{docId} {
      allow read: if true;
      allow create: if isEditor();
      allow update: if isEditor();
      allow delete: if isAdmin();
    }
    
    // --- PRICE ALERTS ---
    match /priceAlerts/{docId} {
      allow read, write: if isSignedInDemo() && (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }
    
    // --- IMPORT HISTORY ---
"""

code = code.replace("// --- IMPORT HISTORY ---", history_rules.strip() + "\n\n    // --- IMPORT HISTORY ---")

with open('firestore.rules', 'w') as f:
    f.write(code)

print("done patching firestore.rules")
