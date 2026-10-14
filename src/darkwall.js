import gsap from 'gsap';
import { reducedMotion, burst } from './fx.js';

/** A dark wall; your pointer (or finger) is a flashlight. Find the work nobody claps for. */
export function initDarkwall() {
  const wall = document.getElementById('darkwall');
  const notes = [...wall.querySelectorAll('.scrawl')];
  if (reducedMotion()) {
    notes.forEach((n) => n.classList.add('is-found'));
    return;
  }

  let found = 0;
  let userDriven = false;
  let idleTimer = 0;
  let visible = false;
  const radius = () => Math.max(110, Math.min(170, wall.clientWidth * 0.18));

  const place = (x, y) => {
    wall.style.setProperty('--mx', `${x}px`);
    wall.style.setProperty('--my', `${y}px`);
    wall.style.setProperty('--rl', `${radius()}px`);
    if (userDriven) discover(x, y);
  };

  function discover(x, y) {
    const r = radius() * 0.45;
    for (const n of notes) {
      if (n.classList.contains('is-found')) continue;
      const left = n.offsetLeft;
      const top = n.offsetTop;
      const inside = x > left - r && x < left + n.offsetWidth + r && y > top - r && y < top + n.offsetHeight + r;
      if (!inside) continue;
      n.classList.add('is-found');
      gsap.fromTo(n, { scale: 1.25 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      found++;
      if (found === notes.length) {
        const b = wall.getBoundingClientRect();
        burst(['👏', '✨', '🔦'], { x: b.left + b.width / 2, y: b.top + b.height / 2, count: 40 });
      }
    }
  }

  const fromEvent = (clientX, clientY) => {
    const r = wall.getBoundingClientRect();
    userDriven = true;
    wall.classList.add('is-touched');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => (userDriven = false), 2500);
    place(clientX - r.left, clientY - r.top);
  };
  wall.addEventListener('pointermove', (e) => fromEvent(e.clientX, e.clientY));
  wall.addEventListener('pointerdown', (e) => fromEvent(e.clientX, e.clientY));
  wall.addEventListener('touchmove', (e) => fromEvent(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  // when nobody is holding the flashlight, it wanders on its own (but finds nothing by itself)
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(wall);
  gsap.ticker.add((time) => {
    if (!visible || userDriven) return;
    const W = wall.clientWidth;
    const H = wall.clientHeight;
    place(W * (0.5 + 0.38 * Math.sin(time * 0.55)), H * (0.5 + 0.36 * Math.sin(time * 0.83 + 1.3)));
  });
}
