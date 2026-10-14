import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './fx.js';

gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger);

/** Wrap every character of an element in spans (words stay unbreakable). */
export function splitChars(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map((w) => `<span class="word">${[...w].map((c) => `<span class="ch char">${c}</span>`).join('')}</span>`)
    .join(' ');
  el.classList.add('is-split');
  return [...el.querySelectorAll('.ch')];
}

/** The torch light and the cursor ring follow the pointer. */
function pointerLife() {
  const torch = document.querySelector('.room__torch');
  const cursor = document.querySelector('.cursor');
  const label = cursor.querySelector('.cursor__label');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener(
    'pointermove',
    (e) => {
      torch.style.setProperty('--tx', `${e.clientX}px`);
      torch.style.setProperty('--ty', `${e.clientY}px`);
      if (fine) {
        cx(e.clientX);
        cy(e.clientY);
      }
    },
    { passive: true }
  );

  if (!fine) return;
  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest('[data-cursor], a, button, label, input, textarea');
    cursor.classList.toggle('is-big', Boolean(hit));
    label.textContent = hit?.dataset.cursor ?? '';
  });
}

/** Stickers you can grab and throw around the hero. */
function stickers() {
  const all = gsap.utils.toArray('.sticker');
  all.forEach((s) => (s.dataset.cursor = 'drag'));
  gsap.from(all, { scale: 0, rotate: () => gsap.utils.random(-90, 90), duration: 0.7, stagger: 0.09, delay: 1.2, ease: 'back.out(2.2)' });
  Draggable.create(all, {
    bounds: '.hero',
    inertia: true,
    zIndexBoost: true,
    onPress() {
      gsap.to(this.target, { scale: 1.15, duration: 0.2 });
    },
    onRelease() {
      gsap.to(this.target, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    },
  });
}

/** Title letters jump when you touch them. */
function jumpyTitle() {
  document.querySelectorAll('.title [data-chars]').forEach((line) => {
    splitChars(line).forEach((ch) => {
      const jump = () =>
        gsap.fromTo(
          ch,
          { rotate: gsap.utils.random(-28, 28), y: -14, scale: 1.3 },
          { rotate: 0, y: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.3)', overwrite: true }
        );
      ch.addEventListener('pointerenter', jump);
      ch.addEventListener('pointerdown', jump);
    });
  });
}

/** Caution tapes run forever and speed up (or reverse) with your scrolling. */
function tapes() {
  const loops = gsap.utils.toArray('.tape__track').map((track, i) => {
    const loop = gsap.fromTo(track, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 26, ease: 'none', repeat: -1 });
    loop.totalTime(loop.duration() * 1000); // room to play backwards
    return loop;
  });
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const boost = 1 + Math.min(7, Math.abs(self.getVelocity()) / 250);
      loops.forEach((loop) => {
        gsap.to(loop, { timeScale: self.direction * boost, duration: 0.15, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.25 });
      });
    },
  });
}

/** Headings lean when you scroll fast. */
function skewOnScroll() {
  const targets = gsap.utils.toArray('.skew, .truth');
  let target = 0;
  let current = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => (target = gsap.utils.clamp(-7, 7, self.getVelocity() / -260)),
  });
  gsap.ticker.add(() => {
    target *= 0.88;
    const next = current + (target - current) * 0.16;
    if (Math.abs(next - current) < 0.005 && Math.abs(next) < 0.01) return;
    current = next;
    const v = `${current.toFixed(2)}deg`;
    targets.forEach((t) => t.style.setProperty('--skew', v));
  });
}

export function initAlive() {
  pointerLife();
  jumpyTitle();
  if (reducedMotion()) return;
  stickers();
  tapes();
  skewOnScroll();
}
