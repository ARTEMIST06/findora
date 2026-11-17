const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Fake login as Admin
  await page.goto('http://localhost:3000/auth', { waitUntil: 'domcontentloaded' });
  
  // We need to inject an admin user into localStorage
  await page.evaluate(() => {
    localStorage.setItem('findora_user', JSON.stringify({
      id: "test-admin",
      email: "aryasingh2366@gmail.com",
      name: "Arya Singh",
      role: "admin",
      createdAt: new Date().toISOString()
    }));
  });
  
  await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 1. Seed Brands
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const brandsTab = tabs.find(t => t.textContent.includes('Brands'));
    if (brandsTab) brandsTab.click();
  });
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Seed Brands'));
    if (btn) btn.click();
  });
  
  // override alert
  page.on('dialog', async dialog => {
    console.log(`Alert: ${dialog.message()}`);
    await dialog.dismiss();
  });

  await page.waitForTimeout(2000);
  
  // 2. Seed Categories
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const catTab = tabs.find(t => t.textContent.includes('Categories'));
    if (catTab) catTab.click();
  });
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Seed Categories'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);

  // 3. Open Drafts
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const draftsTab = tabs.find(t => t.textContent.includes('Drafts'));
    if (draftsTab) draftsTab.click();
  });
  await page.waitForTimeout(1000);

  // 4. Create Draft
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Create Draft'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  
  // Type something
  await page.fill('input[placeholder="e.g. Sony WH-1000XM5 Noise Cancelling Headphones"]', 'Test Draft Product');
  await page.fill('input[placeholder="amazon, flipkart..."]', 'amazon');
  
  // Test helpers
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pitch = btns.find(b => b.textContent.includes('Generate Pitch'));
    if (pitch) pitch.click();
  });
  await page.waitForTimeout(1000);
  
  // Click Manual Save
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const save = btns.find(b => b.querySelector('svg.lucide-save'));
    if (save) save.click();
  });
  await page.waitForTimeout(1000);
  
  // Go back
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const back = btns.find(b => b.textContent.includes('Back to Drafts'));
    if (back) back.click();
  });
  await page.waitForTimeout(1000);
  
  // Check if draft exists
  const hasDraft = await page.evaluate(() => {
    return document.documentElement.innerHTML.includes('Test Draft Product');
  });
  console.log("Draft created successfully:", hasDraft);

  await browser.close();
})();
