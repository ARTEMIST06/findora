const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`[PAGE LOG] ${msg.type().toUpperCase()}: ${msg.text()}`);
    console.log(`[PAGE LOG] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  try {
    console.log("Navigating to signup...");
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    
    await page.waitForTimeout(1000);
    const email = `test2_${Date.now()}@example.com`;
    console.log("Filling form...");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    
    console.log("Submitting...");
    await page.click('button:has-text("Create Account")');
    
    await page.waitForTimeout(5000); 
    
    const html = await page.content();
    console.log("Is Home?", html.includes('Findora') && !html.includes('Create Account'));
    
  } catch (e) {
    console.error("Test execution failed:", e.message);
  } finally {
    await browser.close();
  }
})();
