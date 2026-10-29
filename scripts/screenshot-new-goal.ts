import { chromium } from "playwright";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: "mobile_375", width: 375, height: 812 },
    { name: "tablet_768", width: 768, height: 1024 },
    { name: "desktop_1440", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    await page.goto("http://localhost:3000/");
    await page.evaluate(() => {
      localStorage.setItem("pencill_guest_access", "true");
    });

    await page.goto("http://localhost:3000/new-goal");
    await page.waitForSelector("h1", { timeout: 10000 });

    const outPath = path.join(process.cwd(), "AUDIT", "baseline", "screenshots", `new-goal-${vp.name}-updated.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot: ${outPath}`);
    await context.close();
  }

  await browser.close();
}

main().catch(console.error);
