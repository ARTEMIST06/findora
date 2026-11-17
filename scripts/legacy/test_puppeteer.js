import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) console.log('FAILED REQ:', response.url(), response.status());
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await browser.close();
})();
