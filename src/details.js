import { CAMP } from './config.js';

const pad = (n) => String(n).padStart(2, '0');

export function initDetails() {
  const values = { ...CAMP, where: `${CAMP.place}, ${CAMP.town}` };
  document.querySelectorAll('[data-camp]').forEach((el) => {
    el.textContent = values[el.dataset.camp] ?? '';
  });
  document.querySelectorAll('[data-camp-href]').forEach((el) => {
    el.href = values[el.dataset.campHref];
  });

  const start = new Date(CAMP.start).getTime();
  const end = new Date(CAMP.end).getTime();
  const boxes = [...document.querySelectorAll('[data-countdown]')];
  const days = [...document.querySelectorAll('[data-countdown-days]')];
  const ring = document.querySelector('.ledger__ring .ring');
  const totalWindow = 14 * 86400000; // ring empties over the last two weeks

  function tick() {
    const now = Date.now();
    const left = Math.max(0, start - now);
    const d = Math.floor(left / 86400000);
    const h = Math.floor((left / 3600000) % 24);
    const m = Math.floor((left / 60000) % 60);
    const s = Math.floor((left / 1000) % 60);

    for (const box of boxes) {
      if (now >= end) {
        box.innerHTML = '<p class="countdown__live">GG. That was the camp. 🫡</p>';
      } else if (now >= start) {
        box.innerHTML = '<p class="countdown__live">🔴 The match is live. Hurry.</p>';
      } else {
        box.querySelector('[data-unit=d]').textContent = pad(d);
        box.querySelector('[data-unit=h]').textContent = pad(h);
        box.querySelector('[data-unit=m]').textContent = pad(m);
        box.querySelector('[data-unit=s]').textContent = pad(s);
      }
    }
    days.forEach((el) => (el.textContent = d));
    if (ring) ring.style.strokeDashoffset = String(327 * (1 - Math.min(1, left / totalWindow)));
    if (now < end) setTimeout(tick, 1000 - (now % 1000));
  }
  tick();
}
