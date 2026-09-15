import re

with open('server.ts', 'r') as f:
    code = f.read()

old_csp = """        connectSrc: [
          "'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com", 
          "wss://*.firebaseio.com", 
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com"
        ],"""

new_csp = """        connectSrc: [
          "'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com", 
          "wss://*.firebaseio.com",
          "ws://localhost:*", // Vite HMR
          "http://localhost:*", // Vite HMR
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com"
        ],"""

code = code.replace(old_csp, new_csp)

with open('server.ts', 'w') as f:
    f.write(code)

print("Updated CSP for dev mode")
