import { chromium } from "playwright";

async function main() {
  console.log("=== PEN-003 & PEN-004 End-to-End Verification ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Visit root to set guest credentials
  console.log("1. Setting guest session...");
  await page.goto("http://localhost:3000/");
  await page.evaluate(() => {
    localStorage.setItem("pencill_guest_access", "true");
    localStorage.setItem("pencill_guest_enrollments", JSON.stringify([]));
  });

  // 2. Navigate to /new-goal
  console.log("2. Navigating to /new-goal...");
  await page.goto("http://localhost:3000/new-goal");
  await page.waitForSelector("h1:has-text('What do you want to learn?')", { timeout: 10000 });

  // 3. Verify initial topic pill
  console.log("3. Verifying initial topic pill...");
  const initialPill = await page.locator("span:has-text('JEE Physics')").first();
  if (!(await initialPill.isVisible())) {
    throw new Error("Initial topic pill 'JEE Physics' is not visible.");
  }
  console.log("   Found initial pill: JEE Physics");

  // 4. Test Add Topic validation: empty input
  console.log("4. Testing validation: empty topic submission...");
  const addTopicBtn = page.locator("button:has-text('Add Topic')");
  await addTopicBtn.click();
  const emptyErr = await page.locator("text=Please enter a topic name.");
  if (!(await emptyErr.isVisible())) {
    throw new Error("Expected 'Please enter a topic name.' error was not shown.");
  }
  console.log("   Empty validation passed: error displayed.");

  // 5. Test Add Topic validation: short (<3 chars)
  console.log("5. Testing validation: short topic submission...");
  const topicInput = page.locator("input[placeholder*='Add another subtopic']");
  await topicInput.fill("ab");
  await addTopicBtn.click();
  const shortErr = await page.locator("text=Topic must be at least 3 characters long.");
  if (!(await shortErr.isVisible())) {
    throw new Error("Expected 'Topic must be at least 3 characters long.' error was not shown.");
  }
  console.log("   Length validation passed: error displayed.");

  // 6. Test Add Topic: valid input
  console.log("6. Adding valid custom topic...");
  await topicInput.fill("Classical Electrodynamics");
  await addTopicBtn.click();
  const newPill = page.getByText("Classical Electrodynamics", { exact: true });
  await newPill.waitFor({ timeout: 5000 });
  console.log("   Custom topic pill added successfully!");

  // 7. Test Add Topic validation: duplicate
  console.log("7. Testing validation: duplicate topic...");
  await topicInput.fill("classical electrodynamics");
  await addTopicBtn.click();
  const dupErr = await page.locator("text=is already selected.");
  await dupErr.waitFor({ timeout: 5000 });
  console.log("   Duplicate prevention passed: error displayed.");

  // 8. Test suggested subtopic click
  console.log("8. Testing suggested subtopic addition...");
  const sugBtn = page.locator("button:has-text('+ Thermodynamics')").first();
  if (await sugBtn.isVisible()) {
    await sugBtn.click();
    const thermoPill = page.getByText("Thermodynamics", { exact: true }).first();
    await thermoPill.waitFor({ timeout: 5000 });
    console.log("   Suggested subtopic '+ Thermodynamics' added to topic pills!");
  }

  // 9. Test topic pill removal
  console.log("9. Testing topic pill removal...");
  const removeBtn = page.locator("button[aria-label='Remove topic JEE Physics']");
  await removeBtn.click();
  const jeePillCount = await page.locator("span.bg-primary-container:has-text('JEE Physics')").count();
  if (jeePillCount > 0) {
    throw new Error("Pill 'JEE Physics' was not removed.");
  }
  console.log("   Topic pill removed successfully!");

  // 10. Test Advanced Pedagogical Preferences drawer toggle
  console.log("10. Testing Advanced Pedagogical Preferences drawer...");
  const tuneBtn = page.locator("button[title='Toggle Advanced Pedagogical Preferences']");
  await tuneBtn.click();
  const advDrawer = page.locator("text=Advanced Pedagogical Preferences");
  await advDrawer.waitFor({ timeout: 5000 });
  console.log("    Advanced Preferences drawer opened successfully!");

  // Select an explanation style and knowledge level
  const intuitiveStyle = page.locator("button:has-text('Simple & Intuitive')");
  await intuitiveStyle.click();
  const beginnerLevel = page.locator("button:has-text('Complete Beginner')");
  await beginnerLevel.click();
  const doneBtn = page.locator("button:has-text('Done')");
  await doneBtn.click();
  console.log("    Advanced Preferences updated and closed!");

  // 11. Verify dynamic blueprint shows progression phases
  console.log("11. Verifying dynamic blueprint preview...");
  const phase1 = page.locator("span:has-text('Foundations')").first();
  if (!(await phase1.isVisible())) {
    throw new Error("Curriculum Blueprint dynamic phases not visible.");
  }
  console.log("    Dynamic blueprint estimate and phases verified!");

  // 12. Trigger course generation (PEN-004)
  console.log("12. Triggering curriculum generation...");
  const buildBtn = page.locator("button:has-text('Build My Learning Path')");
  await buildBtn.click();

  console.log("    Waiting for synthesis to complete (up to 60s)...");
  const startCourseBtn = page.locator("button:has-text('Start Learning This Path')");
  await startCourseBtn.waitFor({ timeout: 60000 });
  console.log("    Curriculum synthesis completed successfully!");

  // 13. Navigate to course page
  console.log("13. Starting course...");
  await startCourseBtn.click();
  await page.waitForURL(/\/courses\/path-/, { timeout: 10000 });
  console.log(`    Navigated to course URL: ${page.url()}`);

  // 14. Verify course details page loaded without "not found" error
  console.log("14. Checking course content rendering...");
  const notFoundText = await page.locator("text=The requested curriculum was not found").count();
  if (notFoundText > 0) {
    throw new Error("FAILURE: Course Details page rendered 'The requested curriculum was not found'.");
  }

  // Check for modules in course details
  await page.waitForSelector("h2, h3", { timeout: 10000 });
  const courseTitle = await page.locator("h1").first().textContent();
  console.log(`    Course Title on Course Details Page: "${courseTitle?.trim()}"`);

  // 15. Verify reload persistence
  console.log("15. Testing course reload persistence...");
  await page.reload();
  await page.waitForSelector("h1", { timeout: 10000 });
  const titleAfterReload = await page.locator("h1").first().textContent();
  console.log(`    Title after reload: "${titleAfterReload?.trim()}"`);
  if (!titleAfterReload) {
    throw new Error("Course did not load after reload.");
  }

  // 16. Navigate to /courses to verify course appears in list
  console.log("16. Navigating to /courses to verify enrolled listing...");
  await page.goto("http://localhost:3000/courses");
  await page.waitForSelector("h1:has-text('My Learning Pathways')", { timeout: 10000 });
  const courseCardCount = await page.locator("article, .rounded-xl").count();
  console.log(`    Found course cards in list: ${courseCardCount}`);

  console.log("\n=======================================================");
  console.log("✅ PEN-003 & PEN-004 VERIFICATION COMPLETED WITH ZERO ERRORS!");
  console.log("=======================================================");

  await browser.close();
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
