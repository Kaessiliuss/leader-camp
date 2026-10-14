import { CAMP } from './config.js';

const toIcsDate = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function downloadIcs() {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Groupe Saint Vincent de Paul Ajaltoun//Leaders Camp//EN',
    'BEGIN:VEVENT',
    'UID:leaders-camp-2026-27@svp-ajaltoun',
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(CAMP.start)}`,
    `DTEND:${toIcsDate(CAMP.end)}`,
    `SUMMARY:${CAMP.title}`,
    `LOCATION:${CAMP.place}\\, ${CAMP.town}`,
    'DESCRIPTION:Your game is ready. Undying loyalty yields unrivaled power.',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leaders-camp-2026.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
