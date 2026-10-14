import gsap from 'gsap';
import Matter from 'matter-js';
import { reducedMotion, burst } from './fx.js';

const ITEMS = [
  ['🪢', 'rope (tangled since 2019)'],
  ['⛺', 'tent, 3 pegs short'],
  ['🥾', 'left boot. just left.'],
  ['🧣', 'foulard (whose??)'],
  ['🧭', 'compass (points to snacks)'],
  ['🔦', 'flashlight (dead)'],
  ['🍲', 'THE big pot'],
  ['🧦', 'the sock with no owner'],
  ['🎸', 'guitar (3 strings)'],
  ['🔑', 'THE key'],
  ['🪣', 'bucket (has a hole)'],
  ['🍫', 'emergency chocolate (empty)'],
];

/** The store room: a pile of scout junk with real physics. Get it all into the crate to find the floor. */
export function initStore() {
  const box = document.getElementById('store');
  const crate = box.querySelector('.crate');
  const storedEl = box.querySelector('[data-stored]');
  const hint = box.querySelector('.store__hint');
  const again = box.querySelector('.store__again');
  box.querySelector('[data-total]').textContent = ITEMS.length;

  const items = ITEMS.map(([emoji, tag]) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.cursor = 'drag';
    el.innerHTML = `<span class="item__emoji">${emoji}</span><span class="item__tag">${tag}</span>`;
    box.insertBefore(el, crate);
    return { el, body: null, stored: false };
  });

  let stored = 0;

  const squashCrate = () =>
    gsap.fromTo(crate, { scaleX: 1.12, scaleY: 0.82 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)', transformOrigin: '50% 100%' });

  function win() {
    box.classList.add('is-clean');
    again.hidden = false;
    const b = box.getBoundingClientRect();
    burst(['🎉', '✨', '🧹', '🪢', '🧦'], { x: b.left + b.width / 2, y: b.top + b.height / 2, count: 44 });
  }

  function countStored() {
    stored++;
    storedEl.textContent = stored;
    squashCrate();
    if (stored === items.length) win();
  }

  /* ── Reduced motion: tap an item to put it away. ── */
  if (reducedMotion()) {
    const place = () => {
      const cols = Math.max(2, Math.floor(box.clientWidth / 200));
      items.forEach(({ el }, i) => {
        el.style.transform = `translate(${(i % cols) * ((box.clientWidth * 0.75) / cols) + 10}px, ${box.clientHeight - 110 - Math.floor(i / cols) * 90}px)`;
      });
    };
    place();
    items.forEach((item) =>
      item.el.addEventListener('click', () => {
        if (item.stored) return;
        item.stored = true;
        item.el.style.visibility = 'hidden';
        countStored();
      })
    );
    again.addEventListener('click', () => {
      items.forEach((item) => {
        item.stored = false;
        item.el.style.visibility = '';
      });
      stored = 0;
      storedEl.textContent = 0;
      box.classList.remove('is-clean');
      again.hidden = true;
    });
    return;
  }

  /* ── Physics ── */
  const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = Matter;
  const engine = Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8 });
  engine.gravity.y = 1.1;
  const MAX_SPEED = 34; // px per step — faster than this and things tunnel through walls
  let walls = [];
  let W = 0;
  let H = 0;
  let zone = { left: 0, right: 0, top: 0 };
  let running = false;
  let spawned = false;
  let last = 0;
  let drag = null;

  function buildWalls() {
    Composite.remove(engine.world, walls);
    W = box.clientWidth;
    H = box.clientHeight;
    const cLeft = crate.offsetLeft;
    const cTop = crate.offsetTop;
    const t = 400;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2 - 2, W * 3, t, { isStatic: true, friction: 0.9 }),
      Bodies.rectangle(-t / 2, H / 2, t, H * 6, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2, t, H * 6, { isStatic: true }),
      Bodies.rectangle(W / 2, -H * 2 - t / 2, W * 3, t, { isStatic: true }),
      // the crate's near wall, with an invisible lip so the pile can't slide in by itself
      Bodies.rectangle(cLeft + 4, cTop - 60 + (H - cTop + 60) / 2, 8, H - cTop + 60, { isStatic: true, friction: 0.4 }),
    ];
    Composite.add(engine.world, walls);
    // anything whose centre drops into (or just above) the crate gets sorted
    zone = { left: cLeft + 6, right: W, top: cTop - 36 };
  }

  function spawn() {
    spawned = true;
    const maxX = Math.max(80, crate.offsetLeft - 60);
    items.forEach((item, i) => {
      if (item.stored) return;
      item.w = item.el.offsetWidth;
      item.h = item.el.offsetHeight;
      setTimeout(() => {
        const x = Math.min(maxX, Math.max(item.w / 2 + 8, 40 + Math.random() * (maxX - 40)));
        item.body = Bodies.rectangle(x, -item.h - Math.random() * 220, item.w * 0.9, item.h * 0.9, {
          chamfer: { radius: Math.min(16, item.h / 3) },
          restitution: 0.35,
          friction: 0.6,
          frictionAir: 0.012,
          density: 0.0018,
          angle: (Math.random() - 0.5) * 1.2,
        });
        Body.setAngularVelocity(item.body, (Math.random() - 0.5) * 0.2);
        Composite.add(engine.world, item.body);
      }, i * 140);
    });
  }

  function collect(item) {
    if (drag?.item === item) {
      Composite.remove(engine.world, drag.constraint);
      item.el.classList.remove('is-grabbed');
      drag = null;
    }
    Composite.remove(engine.world, item.body);
    item.body = null;
    item.stored = true;
    gsap.to(item.el, {
      x: crate.offsetLeft + crate.offsetWidth / 2 - item.w / 2,
      y: crate.offsetTop - item.h * 0.2,
      scale: 0.25,
      rotation: '+=200',
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => (item.el.style.visibility = 'hidden'),
    });
    countStored();
  }

  // is a point (in store coordinates) over the crate?
  const overCrate = ({ x, y }, margin = 16) =>
    x > crate.offsetLeft - margin && x < crate.offsetLeft + crate.offsetWidth + margin && y > crate.offsetTop - 40 - margin;

  function step() {
    for (const item of items) {
      const { body } = item;
      if (!body) continue;
      const { x, y } = body.position;
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (speed > MAX_SPEED) Body.setVelocity(body, { x: (body.velocity.x / speed) * MAX_SPEED, y: (body.velocity.y / speed) * MAX_SPEED });
      // safety net: anything that escaped the room gets dropped back in from the top
      if (x < -60 || x > W + 60 || y > H + 60 || y < -H * 1.8) {
        Body.setPosition(body, { x: Math.min(Math.max(60, x), Math.max(70, zone.left - 70)), y: 30 });
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
        continue;
      }
      if (item.touched && x > zone.left && x < zone.right && y > zone.top) {
        collect(item);
        continue;
      }
      item.el.style.transform = `translate(${x - item.w / 2}px, ${y - item.h / 2}px) rotate(${body.angle}rad)`;
    }
  }

  function loop(t) {
    if (!running) return;
    Engine.update(engine, Math.min(1000 / 60, t - last || 16.6));
    last = t;
    step();
    requestAnimationFrame(loop);
  }

  // grab & throw
  const local = (e) => {
    const r = box.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  items.forEach((item) => {
    item.el.style.transform = 'translate(-999px, -999px)';
    item.el.addEventListener('pointerdown', (e) => {
      if (!item.body) return;
      e.preventDefault();
      box.classList.add('is-touched');
      item.touched = true;
      item.el.setPointerCapture(e.pointerId);
      item.el.classList.add('is-grabbed');
      const p = local(e);
      Sleeping.set(item.body, false);
      drag = {
        item,
        constraint: Constraint.create({
          pointA: p,
          bodyB: item.body,
          pointB: { x: p.x - item.body.position.x, y: p.y - item.body.position.y },
          angleB: item.body.angle,
          stiffness: 0.18,
          damping: 0.08,
          length: 0,
        }),
      };
      Composite.add(engine.world, drag.constraint);
    });
    item.el.addEventListener('pointermove', (e) => {
      if (drag?.item !== item) return;
      const p = local(e);
      drag.constraint.pointA = p;
      // the crate lights up as you get close; carrying it over the crate is enough: in it goes
      crate.classList.toggle('is-hover', overCrate(p, 90));
      if (overCrate(p)) {
        crate.classList.remove('is-hover');
        collect(item);
      }
    });
    const release = () => {
      crate.classList.remove('is-hover');
      if (drag?.item !== item) return;
      Composite.remove(engine.world, drag.constraint);
      item.el.classList.remove('is-grabbed');
      drag = null;
    };
    item.el.addEventListener('pointerup', release);
    item.el.addEventListener('pointercancel', release);
  });

  again.addEventListener('click', () => {
    items.forEach((item) => {
      item.stored = false;
      item.touched = false;
      gsap.set(item.el, { clearProps: 'all' });
      item.el.style.transform = 'translate(-999px, -999px)';
    });
    stored = 0;
    storedEl.textContent = 0;
    box.classList.remove('is-clean');
    again.hidden = true;
    spawn();
  });

  buildWalls();
  window.addEventListener('resize', buildWalls);

  // simulate only while the store room is on screen; drop the junk in as soon as it gets close
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (!spawned) {
          buildWalls();
          spawn();
        }
        if (!running) {
          running = true;
          last = performance.now();
          requestAnimationFrame(loop);
        }
      } else {
        running = false;
      }
    },
    { rootMargin: '120px 0px' }
  ).observe(box);
}
