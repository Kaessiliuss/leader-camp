import { SUBMIT_URL } from './config.js';

/**
 * Sends one row to the Google Sheet. Nothing is kept in the browser.
 * type: 'registration' | 'topic'
 * Apps Script can't answer CORS preflights, so this is a fire-and-forget text/plain POST.
 */
export async function send(type, payload) {
  const record = { type, sentAt: new Date().toISOString(), ...payload };

  if (!SUBMIT_URL) {
    console.warn('[camp] SHEET_URL is not set in src/config.js — this submission went nowhere:', record);
    return { ok: true, local: true };
  }

  try {
    await fetch(SUBMIT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(record),
    });
    return { ok: true };
  } catch (error) {
    console.error('[camp] submission failed', error);
    return { ok: false, error };
  }
}
