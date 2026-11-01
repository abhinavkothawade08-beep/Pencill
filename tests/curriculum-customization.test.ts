import test from 'node:test';
import assert from 'node:assert/strict';
import { generateICalendar, formatICalDate } from '../src/lib/schedule/calendar';

test('Curriculum Customization & Calendar Generation Suite', async (t) => {
  await t.test('formatICalDate: formats UTC ISO dates to RFC 5545 timestamp', () => {
    const testDate = new Date('2026-11-01T15:30:00Z');
    const formatted = formatICalDate(testDate);
    assert.equal(formatted, '20261101T153000Z');
  });

  await t.test('generateICalendar: produces valid RFC 5545 calendar string with VEVENT blocks', () => {
    const startDate = new Date('2026-11-02T18:00:00Z');
    const events = [
      {
        summary: 'Pencill: Module 1 - Transformer Architecture',
        description: 'Study session for Machine Learning and Attention Mechanisms',
        startDate,
        durationMinutes: 60,
      },
      {
        summary: 'Pencill: Module 2 - Multi-Head Attention',
        description: 'Practical exercise and coding sandbox session',
        startDate: new Date(startDate.getTime() + 2 * 86400000), // 2 days later
        durationMinutes: 45,
      },
    ];

    const icsContent = generateICalendar(events, 'Pencill AI Curriculum');

    // Validate standard RFC 5545 markers
    assert.ok(icsContent.includes('BEGIN:VCALENDAR'), 'Must begin with BEGIN:VCALENDAR');
    assert.ok(icsContent.includes('END:VCALENDAR'), 'Must end with END:VCALENDAR');
    assert.ok(icsContent.includes('VERSION:2.0'), 'Must specify VERSION:2.0');
    assert.ok(icsContent.includes('PRODID:-//Pencill Personal AI University//Study Planner//EN'), 'Must specify PRODID');
    assert.ok(icsContent.includes('X-WR-CALNAME:Pencill AI Curriculum'), 'Must specify calendar name');

    // Validate VEVENT blocks
    const eventMatches = icsContent.match(/BEGIN:VEVENT/g);
    assert.equal(eventMatches?.length, 2, 'Should contain exactly 2 VEVENT blocks');

    assert.ok(icsContent.includes('SUMMARY:Pencill: Module 1 - Transformer Architecture'));
    assert.ok(icsContent.includes('DTSTART:20261102T180000Z'));
    assert.ok(icsContent.includes('DTEND:20261102T190000Z')); // 60 mins later
  });
});
