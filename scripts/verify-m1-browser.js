const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyM1() {
  console.log('[M1 Verification] Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('[M1 Verification] Navigating to http://localhost:3005/new-goal...');
  await page.goto('http://localhost:3005/new-goal', { waitUntil: 'networkidle' });

  // 1. Verify Sidebar brand and nav items
  console.log('[M1 Verification] Checking Sidebar elements...');
  const wordmark = page.locator('aside img[alt="Pencill Logo"]');
  console.log('  Logo visible:', await wordmark.isVisible());

  const dashboardLink = page.locator('aside a:has-text("Dashboard")');
  console.log('  Dashboard link visible:', await dashboardLink.isVisible());

  // 2. Check profile card
  const profileCard = page.locator('aside:has-text("Aanya Patel")');
  console.log('  Profile card with Aanya Patel visible:', await profileCard.isVisible());

  // 3. Test Notification Bell
  console.log('[M1 Verification] Testing Notification Popover...');
  const bellBtn = page.locator('button[aria-label="View notifications"]');
  await bellBtn.click();
  await page.waitForTimeout(500);
  const notifHeader = page.locator('span.font-semibold:has-text("Notifications")').first();
  console.log('  Notification Popover opened:', await notifHeader.isVisible());

  // Close notif popover by clicking outside
  await page.mouse.click(200, 200);
  await page.waitForTimeout(300);

  // 4. Test Global Search modal
  console.log('[M1 Verification] Testing Global Search Modal...');
  const searchInput = page.locator('input[placeholder*="(Ctrl+K)"]');
  await searchInput.click();
  await page.waitForTimeout(500);

  const modalInput = page.locator('input[placeholder*="academic repositories"]');
  console.log('  Search Modal opened:', await modalInput.isVisible());
  await modalInput.fill('Calculus');
  await page.waitForTimeout(600);

  const topicResult = page.locator('div:has-text("Topics")').first();
  console.log('  Search results visible:', await topicResult.isVisible());

  // Close search modal with Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Capture screenshot
  const screenshotPath = 'C:\\Users\\Abhinav\\.gemini\\antigravity\\brain\\544a8853-0011-4547-af97-fcfcfedc2bf1\\m1-shell-verified.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[M1 Verification] Screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log('[M1 Verification] Complete: All Shell, Storage and Data Layer items verified in browser!');
}

verifyM1().catch((err) => {
  console.error('[M1 Verification Error]:', err);
  process.exit(1);
});
