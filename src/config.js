// Everything a leader sees about when / where / how much lives here.
export const CAMP = {
  title: "Leaders' Camp — Undying Loyalty Yields Unrivaled Power",
  // Saturday is still summer time (UTC+3); the clocks go back overnight, so Sunday is UTC+2.
  start: '2026-10-24T14:00:00+03:00',
  end: '2026-10-25T16:00:00+02:00',
  when: 'Sat 24 Oct, 14:00 → Sun 25 Oct, 16:00',
  place: 'Monastery of the Resurrection',
  town: 'Chabrouh',
  maps: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Monastery of Resurrection Chabrouh'),
  price: '$25',
  priceNote: 'Food included. The machewe alone is worth it.',
};

// ▼ Paste your Google Apps Script web-app link here (it ends in /exec) — setup steps are in apps-script/Code.gs.
//   Until it's filled in, registrations and topics only stay in each visitor's own browser.
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzgle-xXdAYlZ-2E4EwSRqfingfa3eASz0GefWWcCsW59DVhqIAsEss9rbnhnZl-HiYwQ/exec';

export const SUBMIT_URL = SHEET_URL || import.meta.env.VITE_SUBMIT_URL || '';
