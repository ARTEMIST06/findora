import re

with open('firestore.rules', 'r') as f:
    code = f.read()

replacement = """
    // Users can read and write only their own wishlist
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
"""

if 'match /wishlists' not in code:
    code = code.replace("    match /users/{userId} {", replacement + "\n    match /users/{userId} {")
    with open('firestore.rules', 'w') as f:
        f.write(code)

print("done rules")
