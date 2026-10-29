import { chromium } from 'playwright';

async function reproduce() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Setup guest with an enrolled course
  await page.addInitScript(() => {
    localStorage.setItem('pencill_guest_access', 'true');
    localStorage.setItem('pencill_guest_enrollments', JSON.stringify(['lp-v2-mvmswmpc']));
  });

  await page.goto('http://localhost:3000/courses', { waitUntil: 'networkidle' });

  console.log('1. Page loaded. Checking if course exists...');
  const courseCardsBefore = await page.$$eval('h3, h2', (elements) => elements.map(e => e.textContent));
  console.log('Headings found before delete:', courseCardsBefore.filter(t => t?.includes('Generative AI')));

  // Find and click delete button for the course
  // In courses/page.tsx: button with "delete" or icon
  const deleteBtn = page.locator('button[title="Delete Learning Path"]').first();
  const deleteCount = await deleteBtn.count();
  console.log('Delete button found:', deleteCount > 0);

  if (deleteCount > 0) {
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Fill the exact title confirmation input in modal
    const input = page.locator('div[role="dialog"] input');
    await input.fill('Generative AI & Large Language Models Comprehensive Academic Curriculum');
    await page.waitForTimeout(300);

    // Confirm in modal
    const confirmBtn = page.locator('div[role="dialog"] button:has-text("Confirm Delete")');
    console.log('Clicking confirm delete...');
    await confirmBtn.click();
    await page.waitForTimeout(1000);

    const guestEnrollmentsAfterDelete = await page.evaluate(() => localStorage.getItem('pencill_guest_enrollments'));
    console.log('localStorage pencill_guest_enrollments after delete in UI:', guestEnrollmentsAfterDelete);

    console.log('2. Reloading page...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const courseCardsAfter = await page.$$eval('h3, h2', (elements) => elements.map(e => e.textContent));
    const stillPresent = courseCardsAfter.filter(t => t?.includes('Generative AI'));
    console.log('3. After reload - Headings found:', stillPresent);

    if (stillPresent.length > 0) {
      console.log('❌ REPRODUCED BUG: Course reappeared after reload because pencill_guest_enrollments was not cleaned up and deleteLearningPath was skipped without session token!');
    } else {
      console.log('✅ Course did not reappear.');
    }
  }

  await browser.close();
}

reproduce().catch(console.error);
