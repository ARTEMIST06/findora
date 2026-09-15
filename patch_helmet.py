import re

with open('server.ts', 'r') as f:
    code = f.read()

imports = """import express from "express";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';"""

if "import helmet" not in code:
    code = code.replace("import express from \"express\";\nimport rateLimit from 'express-rate-limit';", imports)

setup_old = """  // Trust the first proxy (e.g. Nginx, Cloud Run) so rate limiting identifies client IPs correctly
  app.set('trust proxy', 1);

  app.use(express.json());"""

setup_new = """  // Trust the first proxy (e.g. Nginx, Cloud Run) so rate limiting identifies client IPs correctly
  app.set('trust proxy', 1);

  // Apply Helmet for production security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://apis.google.com", 
          "https://www.gstatic.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "*"], // allow external product images
        connectSrc: [
          "'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com", 
          "wss://*.firebaseio.com", 
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com"
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Prevents loading external product images if enabled
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for Firebase Google Auth popup
  }));

  app.use(express.json());"""

if "app.use(helmet" not in code:
    code = code.replace(setup_old, setup_new)

with open('server.ts', 'w') as f:
    f.write(code)

print("Patched server.ts with helmet")
