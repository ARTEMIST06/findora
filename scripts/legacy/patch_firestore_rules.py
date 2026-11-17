import re

with open('firestore.rules', 'r') as f:
    code = f.read()

# Fix the priceAlerts rules
# The previous rule would fail on `create` because `resource` is null.
old_alerts = """    // --- PRICE ALERTS ---
    match /priceAlerts/{docId} {
      allow read, write: if isSignedInDemo() && (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }"""

new_alerts = """    // --- PRICE ALERTS ---
    match /priceAlerts/{docId} {
      allow read: if isSignedInDemo() && request.auth.uid == resource.data.userId;
      allow create: if isSignedInDemo() && request.auth.uid == request.resource.data.userId;
      allow update: if isSignedInDemo() && request.auth.uid == resource.data.userId && request.auth.uid == request.resource.data.userId;
      allow delete: if isSignedInDemo() && request.auth.uid == resource.data.userId;
    }
    
    // --- LOGIN HISTORY ---
    match /securityEvents/{docId} {
      allow read: if isSignedInDemo() && (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if isSignedInDemo() && request.auth.uid == request.resource.data.userId;
      allow update, delete: if false; // Security events are immutable
    }"""

code = code.replace(old_alerts, new_alerts)

with open('firestore.rules', 'w') as f:
    f.write(code)
print("Patched firestore.rules")
