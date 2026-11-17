const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    page.on('console', msg => console.log(`[LOG] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[ERR] ${err.message}`));
    
    await page.goto('http://localhost:3000/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    console.log("HTML length:", html.length);
    console.log("Includes 'Verifying session':", html.includes('Verifying session'));
    console.log("Includes 'Create your Findora account':", html.includes('Create your Findora account'));
    
  } finally {
    await browser.close();
  }
})();
