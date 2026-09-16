const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[PAGE LOG] ${msg.type().toUpperCase()}: ${msg.text()}`));
  
  try {
    const email = `test_regress_${Date.now()}@example.com`;
    const password = 'password123';
    
    // 1. Email Sign Up
    console.log("Testing Signup...");
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(3000); 
    
    let html = await page.content();
    if (html.includes('Test User') || html.includes('Sign Out') || html.includes('Profile')) {
      console.log("Signup: PASS");
    } else {
      console.log("Signup: FAIL");
    }
  } catch(e) {
    console.error("Test execution failed:", e.message);
  } finally {
    await browser.close();
  }
})();
