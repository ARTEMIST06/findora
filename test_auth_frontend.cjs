const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[PAGE LOG] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]: ${err.message}`);
  });
  page.on('requestfailed', request => {
    console.log(`[REQ FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log("Navigating to auth page...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Check if auth page
    console.log("Clicking Sign In...");
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(1000);
    
    console.log("Filling out email signup...");
    const email = `test_${Date.now()}@example.com`;
    
    // Switch to signup mode
    await page.click('button:has-text("Sign up instead")').catch(() => {});
    await page.waitForTimeout(500);
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    
    console.log("Submitting signup...");
    await page.click('button:has-text("Create Account")');
    
    await page.waitForTimeout(3000); // Wait for results
    
    console.log("Checking UI state...");
    const html = await page.content();
    if (html.includes('Account created successfully')) {
      console.log("SUCCESS: Account created");
    } else {
      console.log("NO SUCCESS MESSAGE FOUND");
    }
    
  } catch (e) {
    console.error("Test execution failed:", e.message);
  } finally {
    await browser.close();
  }
})();
