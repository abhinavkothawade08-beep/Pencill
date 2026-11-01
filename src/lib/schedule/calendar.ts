/**
 * RFC 5545 iCalendar (.ics) Generator for Pencill Study Planner
 * Generates standards-compliant calendar files compatible with Google Calendar, Apple Calendar, and Outlook.
 */

export interface ScheduleEvent {
  summary: string;
  description: string;
  startDate: Date;
  durationMinutes: number;
  location?: string;
}

export function formatICalDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function generateICalendar(events: ScheduleEvent[], calendarName: string = 'Pencill Study Schedule'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pencill Personal AI University//Study Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
  ];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const uid = `pencill-${Date.now()}-${i}@pencill.app`;
    const dtStamp = formatICalDate(new Date());
    const dtStart = formatICalDate(ev.startDate);
    const endDate = new Date(ev.startDate.getTime() + ev.durationMinutes * 60 * 1000);
    const dtEnd = formatICalDate(endDate);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${ev.summary.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${ev.description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
      ev.location ? `LOCATION:${ev.location}` : 'LOCATION:Pencill Learning Workspace',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICSFile(filename: string, icsContent: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
