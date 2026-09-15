import re

with open('firestore.rules', 'r') as f:
    code = f.read()

users_new = """      allow update: if isSignedInDemo() && (
        isAdmin() ||
        (request.auth.uid == userId && !incoming().diff(existing()).affectedKeys().hasAny(['role', 'email', 'createdAt', 'id']))
      );
      allow delete: if isSignedInDemo() && request.auth.uid == userId;
    }"""
users_old = """      allow update: if isSignedInDemo() && (
        isAdmin() ||
        (request.auth.uid == userId && !incoming().diff(existing()).affectedKeys().hasAny(['role', 'email', 'createdAt', 'id']))
      );
    }"""

sec_new = """    match /securityEvents/{docId} {
      allow read: if isSignedInDemo() && (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if isSignedInDemo() && request.auth.uid == request.resource.data.userId;
      allow update: if false; // Security events are immutable during account lifecycle
      allow delete: if isSignedInDemo() && request.auth.uid == resource.data.userId && !exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }"""

sec_old = """    match /securityEvents/{docId} {
      allow read: if isSignedInDemo() && (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if isSignedInDemo() && request.auth.uid == request.resource.data.userId;
      allow update, delete: if false; // Security events are immutable
    }"""

code = code.replace(users_new, users_old)
code = code.replace(sec_new, sec_old)

with open('firestore.rules', 'w') as f:
    f.write(code)
print("Reverted firestore.rules")
