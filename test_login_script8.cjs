const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const email = `test_actual_${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(3000); 
    
    const html = await page.content();
    console.log("Has 'Sign In' button?", html.includes('Sign In'));
    console.log("Has 'Sign Out' button?", html.includes('Sign Out'));
    console.log("Has User Name?", html.includes('Test User'));
    
  } finally {
    await browser.close();
  }
})();
