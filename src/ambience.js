import { reducedMotion } from './fx.js';

/** Embers drifting up from the hearth. */
export function initAmbience() {
  const canvas = document.getElementById('embers');
  const ctx = canvas.getContext('2d');
  let embers = [];
  let w = 0;
  let h = 0;
  let raf = 0;
  let last = 0;

  const spawn = (anywhere = false) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: Math.random() * 1.8 + 0.6,
    vy: Math.random() * 22 + 14, // px per second, upwards
    sway: Math.random() * 18 + 6,
    phase: Math.random() * Math.PI * 2,
    life: Math.random() * 0.5 + 0.5,
    hue: 22 + Math.random() * 20,
  });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, (w * h) / 16000));
    embers = Array.from({ length: count }, () => spawn(true));
  }

  function draw(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) {
      e.y -= e.vy * dt;
      const x = e.x + Math.sin(t / 1000 + e.phase) * e.sway;
      // brightest near the floor, fading as it rises
      const fade = Math.max(0, Math.min(1, e.y / h)) * e.life;
      const flicker = 0.7 + 0.3 * Math.sin(t / 120 + e.phase * 3);
      const g = ctx.createRadialGradient(x, e.y, 0, x, e.y, e.r * 5);
      g.addColorStop(0, `hsla(${e.hue}, 100%, 70%, ${0.9 * fade * flicker})`);
      g.addColorStop(1, `hsla(${e.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, e.y, e.r * 5, 0, Math.PI * 2);
      ctx.fill();
      if (e.y < -20) Object.assign(e, spawn());
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(t) {
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  if (reducedMotion()) {
    draw(0);
    return;
  }
  raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  });
}
