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
    
    // print out all text in the navbar
    const navbarText = await page.evaluate(() => {
      return document.querySelector('header')?.innerText || 'No header';
    });
    console.log("NAVBAR TEXT:", navbarText);
    
    // check if the user is in localStorage
    const ls = await page.evaluate(() => {
      return localStorage.getItem('findora_current_user');
    });
    console.log("LOCALSTORAGE USER:", ls);
    
  } finally {
    await browser.close();
  }
})();
