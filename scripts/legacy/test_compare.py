import re

with open('src/pages/public/ComparePage.tsx', 'r') as f:
    code = f.read()

# Let's see if we need to fix the compare button
if 'handleStoreClick' in code or 'Redirecting' in code:
    print("Has old store click")

