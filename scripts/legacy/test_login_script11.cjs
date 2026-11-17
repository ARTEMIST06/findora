const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[PAGE LOG] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR]: ${err.message}`));
  
  try {
    const email = `test_login_${Date.now()}@example.com`;
    
    // First signup
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(3000); 
    
    // Now logout
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(1000);
    
    // Now login
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    console.log("Submitting Login...");
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    const navbarText = await page.evaluate(() => {
      return document.querySelector('header')?.innerText || 'No header';
    });
    console.log("NAVBAR TEXT AFTER LOGIN:", navbarText);
    
  } catch(e) {
    console.log(e);
  } finally {
    await browser.close();
  }
})();
