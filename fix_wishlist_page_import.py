import re

with open('src/pages/public/WishlistPage.tsx', 'r') as f:
    code = f.read()

code = code.replace("import React from 'react';", "import React, { useEffect } from 'react';")

with open('src/pages/public/WishlistPage.tsx', 'w') as f:
    f.write(code)

print("done wishlist import")
