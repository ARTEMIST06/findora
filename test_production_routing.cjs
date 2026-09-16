const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const routesToTest = [
    '/',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
    '/affiliate-disclosure',
    '/cookie-disclosure',
    '/about',
    '/contact',
    '/products',
    '/admin'
  ];

  let allPassed = true;

  for (const route of routesToTest) {
    try {
      console.log(`Testing route: ${route}`);
      const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500); // let react render
      const content = await page.content();
      
      // Basic check: should not show the fallback "Page Not Found" if the route is valid
      if (content.includes('Page Not Found') && route !== '/invalid-route') {
         console.error(`❌ Route ${route} failed (shows Page Not Found)`);
         allPassed = false;
      } else {
         console.log(`✅ Route ${route} rendered successfully`);
      }
    } catch(e) {
      console.error(`❌ Route ${route} threw error:`, e.message);
      allPassed = false;
    }
  }

  await browser.close();
  if (allPassed) {
    console.log("All production routes verified successfully.");
    process.exit(0);
  } else {
    console.error("Some routes failed.");
    process.exit(1);
  }
})();
