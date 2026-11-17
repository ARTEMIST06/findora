const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/product/boat-rockerz-371', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000); // Wait for loading skeleton to finish
  
  const html = await page.content();
  console.log("Current URL:", page.url());
  console.log("Product Found:", !html.includes('Product Not Found'));
  console.log("Transparency Notice Present:", html.includes('Transparency Disclosure'));
  
  const isStickyVisible = await page.evaluate(() => {
    const sticky = document.querySelector('.fixed.bottom-0');
    return sticky !== null && window.getComputedStyle(sticky).display !== 'none';
  });
  console.log(`Sticky Bottom Action Bar: ${isStickyVisible ? 'Visible' : 'Not Found'}`);
  
  await browser.close();
})();
