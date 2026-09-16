const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/product/boat-rockerz-371', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const historyTab = tabs.find(t => t.textContent.includes('Price History'));
    if (historyTab) historyTab.click();
  });
  
  await page.waitForTimeout(1000);
  
  const hasRecharts = await page.evaluate(() => {
    return document.querySelector('.recharts-wrapper') !== null || document.body.innerHTML.includes('No price history available');
  });
  
  console.log("History Tab Working (Chart or Empty State):", hasRecharts);
  await browser.close();
})();
