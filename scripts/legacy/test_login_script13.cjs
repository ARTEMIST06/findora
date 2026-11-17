const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[PAGE LOG] ${msg.type().toUpperCase()}: ${msg.text()}`));
  
  try {
    const email = `test_login_${Date.now()}@example.com`;
    
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.click('button.bg-blue-600:has-text("Create Account")');
    await page.waitForTimeout(3000); 
    
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(1000);
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    console.log("Submitting Login...");
    // Specifically target the form button
    await page.click('form button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    const navbarText = await page.evaluate(() => {
      return document.querySelector('header')?.innerText || 'No header';
    });
    console.log("NAVBAR TEXT AFTER LOGIN:", navbarText);
    
  } finally {
    await browser.close();
  }
})();
