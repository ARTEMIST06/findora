import re

with open('server.ts', 'r') as f:
    code = f.read()

imports = """import express from "express";
import rateLimit from 'express-rate-limit';"""

code = code.replace('import express from "express";', imports)

server_setup = """async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the first proxy (e.g. Nginx, Cloud Run) so rate limiting identifies client IPs correctly
  app.set('trust proxy', 1);

  app.use(express.json());

  // Configure rate limiter for external API fetches
  const fetchProductLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes window
    max: 200, // Allow up to 200 requests per 5 minutes per IP (supports editor bulk imports)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip} on /api/fetch-product`);
      res.status(429).json({ 
        success: false, 
        message: 'Too many product fetch requests from this IP. Please try again in a few minutes.' 
      });
    }
  });

  // API routes
  app.post("/api/fetch-product", fetchProductLimiter, async (req, res) => {"""

old_server_setup = """async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/fetch-product", async (req, res) => {"""

code = code.replace(old_server_setup, server_setup)

with open('server.ts', 'w') as f:
    f.write(code)

print("Patched server.ts with express-rate-limit")
