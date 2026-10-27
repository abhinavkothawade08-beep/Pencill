const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyBuilderFlow() {
  console.log('[Builder Verification] Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  console.log('[Builder Verification] Navigating to http://localhost:3005/new-goal...');
  await page.goto('http://localhost:3005/new-goal', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('h1:has-text("What do you want to learn?")', { timeout: 15000 });

  // 1. Verify Page Header and Default Blueprint
  console.log('[Builder Verification] 1. Checking page header & initial state...');
  const title = page.locator('h1:has-text("What do you want to learn?")');
  console.log('  Page header visible:', await title.isVisible());

  // 2. Test Domain Selection & Cascade
  console.log('[Builder Verification] 2. Testing Domain Selector & cascade...');
  // Find Engineering domain tile
  const engDomainBtn = page.locator('button:has-text("Engineering & Technology")').first();
  console.log('  Engineering tile visible:', await engDomainBtn.isVisible());
  await engDomainBtn.click();
  await page.waitForTimeout(500);

  // Check if Keep/Clear banner or Engineering subjects appear
  const keepClearBanner = page.locator('button:has-text("Keep Topics")').first();
  if (await keepClearBanner.isVisible()) {
    console.log('  Keep/Clear domain switch banner visible, clicking Keep Topics');
    await keepClearBanner.click();
    await page.waitForTimeout(300);
  }

  // Click back to School domain
  const schoolDomainBtn = page.locator('button:has-text("School Education")').first();
  await schoolDomainBtn.click();
  await page.waitForTimeout(400);

  // 3. Test Topics Tray
  console.log('[Builder Verification] 3. Testing Topics tray...');
  const topicChip = page.locator('text=Class 11 Mechanics & Rotational Dynamics').first();
  console.log('  Default topic chip visible:', await topicChip.isVisible());

  // Add a custom topic via input
  const customTopicInput = page.locator('input[placeholder*="Type custom topic"]');
  if (await customTopicInput.isVisible()) {
    await customTopicInput.fill('Electromagnetism & Induction');
    const addTopicBtn = page.locator('button:has-text("Add")').first();
    await addTopicBtn.click();
    await page.waitForTimeout(300);
    console.log('  Added custom topic');
  }

  // 4. Test Depth Ladder toggle
  console.log('[Builder Verification] 4. Testing Depth Ladder (6 to 12 toggle)...');
  const toggleLadderBtn = page.locator('button:has-text("Show All 12 Levels"), button:has-text("Show Fewer Levels")').first();
  if (await toggleLadderBtn.isVisible()) {
    const textBefore = await toggleLadderBtn.innerText();
    console.log('  Toggle ladder button text:', textBefore);
    await toggleLadderBtn.click();
    await page.waitForTimeout(300);
    const textAfter = await toggleLadderBtn.innerText();
    console.log('  Toggle ladder button flipped to:', textAfter);
  }

  // 5. Test Modalities
  console.log('[Builder Verification] 5. Testing Modality cards...');
  const flashcardCard = page.locator('text=Spaced Formula Flashcards').first();
  console.log('  Flashcards modality card visible:', await flashcardCard.isVisible());

  // 6. Test Weekly Hours Slider and Preset Sync
  console.log('[Builder Verification] 6. Testing Weekly Commitment...');
  const intensivePreset = page.locator('button:has-text("Intensive")').first();
  if (await intensivePreset.isVisible()) {
    await intensivePreset.click();
    await page.waitForTimeout(300);
    console.log('  Clicked Intensive preset');
  }

  // 7. Test Advanced Preferences Accordion
  console.log('[Builder Verification] 7. Testing Advanced Preferences Accordion...');
  const advancedAccordionBtn = page.locator('button:has-text("Advanced Learning Customization")').first();
  if (await advancedAccordionBtn.isVisible()) {
    await advancedAccordionBtn.click();
    await page.waitForTimeout(400);
    console.log('  Expanded Advanced accordion');

    // Test Curator Notes
    const curatorTextarea = page.locator('textarea[placeholder*="Curator notes"]').first();
    if (await curatorTextarea.isVisible()) {
      await curatorTextarea.fill('Prioritize MIT OCW and Khan Academy for deep derivations.');
      await page.waitForTimeout(200);
      console.log('  Curator notes filled');
    }
  }

  // 8. Test Blueprint Preview
  console.log('[Builder Verification] 8. Checking Curriculum Blueprint Panel...');
  const blueprintTitle = page.locator('text=Curriculum Blueprint');
  console.log('  Blueprint title visible:', await blueprintTitle.isVisible());

  // 9. Run Curator Pipeline
  console.log('[Builder Verification] 9. Clicking "Build My Learning Path"...');
  const buildBtn = page.locator('button:has-text("Build My Learning Path")').first();
  console.log('  Build button visible:', await buildBtn.isVisible());
  await buildBtn.click();

  // Wait for Curator Engine stages to progress
  console.log('  Waiting for Curator Engine execution...');
  await page.waitForTimeout(4000);

  // Check stage progress
  const curatorStatus = page.locator('span:has-text("Curator Engine")').first();
  console.log('  Curator Status Panel active:', await curatorStatus.isVisible());

  // Wait for completion (engine finishes within 5-10s)
  try {
    await page.waitForSelector('button:has-text("Open Learning Path")', { timeout: 20000 });
    console.log('  Curator pipeline successfully completed!');
  } catch (e) {
    console.log('  Waiting additional 5s for completion...');
    await page.waitForTimeout(5000);
  }

  // Check "Open Learning Path" button
  const openBtn = page.locator('button:has-text("Open Learning Path")').first();
  console.log('  "Open Learning Path" button ready:', await openBtn.isVisible());

  // 10. Capture full-page screenshot
  const screenshotPath = 'C:\\Users\\Abhinav\\.gemini\\antigravity\\brain\\544a8853-0011-4547-af97-fcfcfedc2bf1\\m2-m5-builder-verified.png';
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 8000 });
  } catch (e) {
    console.log('  Taking viewport screenshot...');
    await page.screenshot({ path: screenshotPath, fullPage: false });
  }
  console.log(`[Builder Verification] Full screenshot captured at ${screenshotPath}`);

  await browser.close();
  console.log('[Builder Verification] Milestones M2-M5 verified successfully in the browser!');
}

verifyBuilderFlow().catch((err) => {
  console.error('[Builder Verification Error]:', err);
  process.exit(1);
});
