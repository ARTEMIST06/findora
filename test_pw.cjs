const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => { if(!res.ok()) console.log('FAILED REQ:', res.url(), res.status()) });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log("PAGE RENDERED. Title:", await page.title());
  await browser.close();
})();
