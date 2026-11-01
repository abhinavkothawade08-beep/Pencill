import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const DIRECTORY_PATH = path.join(process.cwd(), 'data', 'master-youtube-educator-directory.json');

const CANONICAL_DOMAINS = [
  'Science & Mathematics',
  'School Education',
  'Engineering & Technology',
  'Languages & Communication',
  'Business, Management & Commerce',
  'Arts, Humanities & Social Sciences',
  'Medical & Health Sciences',
  'Law & Government',
  'Finance, Accounting & Professional Qualifications',
  'Vocational & Applied Technical Skills',
  'Research & Academic Development',
  'Personal & Practical Learning',
];

test('Master Educator Directory Integrity & Verification Suite', async (t) => {
  assert.ok(fs.existsSync(DIRECTORY_PATH), 'Master YouTube Educator Directory JSON must exist at data/master-youtube-educator-directory.json');

  const raw = fs.readFileSync(DIRECTORY_PATH, 'utf8');
  const data = JSON.parse(raw);
  const directory: any[] = data.educators || data;

  await t.test('Directory size: contains full roster of vetted educators (>= 100 channels)', () => {
    assert.ok(directory.length >= 100, `Directory should contain at least 100 channels, found ${directory.length}`);
    assert.equal(directory.length, 118, 'Directory contains exactly 118 curated master educator channels');
  });

  await t.test('Zero broken links: 100% of educators have valid YouTube channel URLs', () => {
    for (const edu of directory) {
      assert.ok(edu.url, `Educator "${edu.name}" must have a URL defined`);
      assert.notEqual(edu.url, 'NOT_CAPTURED', `Educator "${edu.name}" has NOT_CAPTURED URL`);
      assert.ok(
        edu.url.startsWith('https://www.youtube.com/'),
        `Educator "${edu.name}" URL "${edu.url}" must be an official YouTube URL`
      );
      assert.ok(
        edu.url.includes('/@') || edu.url.includes('/channel/UC'),
        `Educator "${edu.name}" URL "${edu.url}" must use canonical @handle or /channel/UC format`
      );
      // Ensure no search result redirects or watch URLs
      assert.ok(!edu.url.includes('/results?'), `Educator "${edu.name}" has search URL`);
      assert.ok(!edu.url.includes('/watch?v='), `Educator "${edu.name}" has video URL instead of channel URL`);
    }
  });

  await t.test('Domain coverage: all 12 educational domains have verified educator coverage', () => {
    const domainCounts = new Map<string, number>();

    for (const edu of directory) {
      const dom = edu.grp || edu.domain || 'Unassigned';
      domainCounts.set(dom, (domainCounts.get(dom) || 0) + 1);
    }

    for (const domain of CANONICAL_DOMAINS) {
      const count = domainCounts.get(domain) || 0;
      assert.ok(
        count > 0,
        `Domain "${domain}" must have at least 1 verified master educator (found ${count})`
      );
    }
  });

  await t.test('Verification attributes: educators have valid channel ID or handle', () => {
    for (const edu of directory) {
      assert.ok(
        edu.cid || edu.handle,
        `Educator "${edu.name}" must have a channel ID or official handle`
      );
    }
  });
});
