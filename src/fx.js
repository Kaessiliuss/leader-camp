export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function particle(char, size) {
  const el = document.createElement('span');
  el.className = 'particle';
  el.textContent = char;
  el.style.fontSize = `${size}px`;
  document.body.appendChild(el);
  return el;
}

/** Emoji explosion from a point (defaults to screen centre). */
export function burst(emojis = ['🎉', '✨', '🪙', '👁️', '🫡'], { x, y, count = 36 } = {}) {
  if (reducedMotion()) return;
  const cx = x ?? window.innerWidth / 2;
  const cy = y ?? window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    const el = particle(pick(emojis), rand(18, 38));
    const angle = rand(0, Math.PI * 2);
    const dist = rand(120, Math.max(window.innerWidth, window.innerHeight) * 0.55);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    el.animate(
      [
        { transform: `translate(${cx}px, ${cy}px) scale(.3) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${cx + dx}px, ${cy + dy + 140}px) scale(1) rotate(${rand(-260, 260)}deg)`, opacity: 0 },
      ],
      { duration: rand(1100, 1900), easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' }
    ).onfinish = () => el.remove();
  }
}

/** Emojis raining from the top of the screen. */
export function rain(emojis = ['😭', '💔', '🥀'], count = 18) {
  if (reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const el = particle(pick(emojis), rand(20, 44));
    const x = rand(0, window.innerWidth - 30);
    el.animate(
      [
        { transform: `translate(${x}px, -60px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + rand(-60, 60)}px, ${window.innerHeight + 60}px) rotate(${rand(-180, 180)}deg)`, opacity: 0.8 },
      ],
      { duration: rand(1400, 2400), delay: rand(0, 500), easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'both' }
    ).onfinish = () => el.remove();
  }
}

export function shake(el) {
  if (reducedMotion() || !el) return;
  el.classList.remove('is-shaking');
  void el.offsetWidth;
  el.classList.add('is-shaking');
}
