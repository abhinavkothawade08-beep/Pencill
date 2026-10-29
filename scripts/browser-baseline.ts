import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface RouteResult {
  route: string;
  width: number;
  screenshotPath: string;
  consoleErrors: string[];
  consoleWarnings: string[];
  pageErrors: string[];
  networkFailures: string[];
  statusCode?: number;
  pageTitle?: string;
}

const VIEWPORTS = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1440, height: 900, name: 'desktop' },
];

const ROUTES = [
  { path: '/', slug: 'home' },
  { path: '/dashboard', slug: 'dashboard' },
  { path: '/new-goal', slug: 'new-goal' },
  { path: '/explore', slug: 'explore' },
  { path: '/courses', slug: 'courses' },
  { path: '/courses/mit-8-012-physics-i-classical-mechanics', slug: 'course-mit-8-012' },
  { path: '/learn/mit-8-012-physics-i-classical-mechanics/les-mit-8-012-1-1', slug: 'learn-lesson' },
  { path: '/practice', slug: 'practice' },
  { path: '/progress', slug: 'progress' },
  { path: '/bookmarks', slug: 'bookmarks' },
  { path: '/login', slug: 'login' },
  { path: '/signup', slug: 'signup' },
];

async function runBaseline() {
  const screenshotDir = path.join(process.cwd(), 'AUDIT', 'baseline', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const results: RouteResult[] = [];

  console.log(`Starting Playwright Baseline Audit across ${ROUTES.length} routes and 3 viewports...`);

  for (const r of ROUTES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // Enable guest access for dashboard and learning routes
      await page.addInitScript(() => {
        localStorage.setItem('pencill_guest_access', 'true');
      });

      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];
      const pageErrors: string[] = [];
      const networkFailures: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
          consoleWarnings.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      page.on('requestfailed', (req) => {
        const failure = req.failure();
        networkFailures.push(`${req.method()} ${req.url()} - ${failure?.errorText || 'Unknown failure'}`);
      });

      const url = `http://localhost:3000${r.path}`;
      const screenshotFilename = `${r.slug}_${vp.width}.png`;
      const screenshotFilePath = path.join(screenshotDir, screenshotFilename);

      let statusCode: number | undefined;
      let title: string | undefined;

      try {
        const response = await page.goto(url, { waitUntil: 'load', timeout: 15000 });
        statusCode = response?.status();
        // Give client hydration a moment
        await page.waitForTimeout(1000);
        title = await page.title();
        await page.screenshot({ path: screenshotFilePath, fullPage: false });
      } catch (err: any) {
        pageErrors.push(`Navigation failed: ${err.message}`);
        try {
          await page.screenshot({ path: screenshotFilePath, fullPage: false });
        } catch {}
      }

      const relativeScreenshot = path.relative(process.cwd(), screenshotFilePath);
      results.push({
        route: r.path,
        width: vp.width,
        screenshotPath: relativeScreenshot,
        consoleErrors,
        consoleWarnings,
        pageErrors,
        networkFailures,
        statusCode,
        pageTitle: title,
      });

      console.log(`[${vp.width}px] ${r.path} -> Status: ${statusCode || 'ERR'} | Console Err: ${consoleErrors.length} | Page Err: ${pageErrors.length}`);
      await context.close();
    }
  }

  await browser.close();

  // Write reports
  const jsonReportPath = path.join(process.cwd(), 'AUDIT', 'baseline', 'browser-baseline-report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));

  let mdReport = `# Browser Baseline Audit Report (Phase 0)\n\n`;
  mdReport += `**Timestamp**: ${new Date().toISOString()}\n`;
  mdReport += `**Base URL**: http://localhost:3000\n\n`;
  mdReport += `## Route Breakdown\n\n`;
  mdReport += `| Route | Width | Status | Console Errors | Page Errors | Network Failures | Screenshot |\n`;
  mdReport += `| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

  for (const res of results) {
    const errCount = res.consoleErrors.length;
    const pageErrCount = res.pageErrors.length;
    const netFailCount = res.networkFailures.length;
    mdReport += `| \`${res.route}\` | ${res.width}px | ${res.statusCode || 'FAIL'} | ${errCount} | ${pageErrCount} | ${netFailCount} | [Screenshot](${res.screenshotPath.replace(/\\/g, '/')}) |\n`;
  }

  mdReport += `\n## Error Details\n\n`;
  for (const res of results) {
    if (res.consoleErrors.length > 0 || res.pageErrors.length > 0 || res.networkFailures.length > 0) {
      mdReport += `### \`${res.route}\` (${res.width}px)\n`;
      if (res.pageErrors.length > 0) {
        mdReport += `**Page Errors:**\n`;
        res.pageErrors.forEach(e => mdReport += `- ${e}\n`);
      }
      if (res.consoleErrors.length > 0) {
        mdReport += `**Console Errors:**\n`;
        res.consoleErrors.forEach(e => mdReport += `- \`${e}\`\n`);
      }
      if (res.networkFailures.length > 0) {
        mdReport += `**Network Failures:**\n`;
        res.networkFailures.forEach(e => mdReport += `- \`${e}\`\n`);
      }
      mdReport += `\n`;
    }
  }

  const mdReportPath = path.join(process.cwd(), 'AUDIT', 'baseline', 'browser-baseline-report.md');
  fs.writeFileSync(mdReportPath, mdReport);

  console.log(`Baseline report written to ${mdReportPath}`);
}

runBaseline().catch(err => {
  console.error('runBaseline failed:', err);
  process.exit(1);
});
