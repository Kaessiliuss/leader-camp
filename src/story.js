import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars } from './alive.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/** A timeline scrubbed across a chapter while its stage is stuck to the screen. */
const chapter = (id) =>
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: `#${id}`, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  });

const hold = (tl, duration = 0.3) => tl.to({}, { duration });

/** The sideways strip needs as much vertical scroll as it is wide. */
function sizeTruths() {
  const track = $('.truths__track');
  const distance = Math.max(0, track.scrollWidth - window.innerWidth);
  $('#scene-truths').style.setProperty('--truths-len', `${distance + window.innerHeight * 1.3}px`);
}

function phoneScene() {
  const tl = chapter('scene-phone');
  const msgs = $$('.phone__scroll .msg');
  const scroller = $('.phone__scroll');
  const chat = $('.phone__chat');
  const phone = $('.phone');
  const batteryText = $('[data-battery]');
  const batteryBar = $('[data-battery-bar]');

  // explicit starting states (a staggered fromTo only primes its first target)
  gsap.set(msgs, { opacity: 0, y: 18, scale: 0.92 });
  gsap.set('.msg--fly', { opacity: 0, scale: 0.2 });

  tl.from(phone, { y: 120, rotation: -6, opacity: 0, duration: 0.5, ease: 'back.out(1.4)' }).from(
    '.phone__text h2',
    { opacity: 0, x: 60, duration: 0.4 },
    '<0.1'
  );
  msgs.forEach((m, i) => {
    tl.to(m, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'back.out(2)' }, i === 0 ? '+=0.1' : '+=0.16').to(
      scroller,
      { y: () => -Math.max(0, m.offsetTop + m.offsetHeight + 12 - chat.clientHeight), duration: 0.15, ease: 'power2.out' },
      '<'
    );
  });
  const battery = { v: 100 };
  const chatEnd = tl.duration();
  tl.to(
    battery,
    {
      v: 3,
      duration: chatEnd - 0.4,
      onUpdate: () => {
        batteryText.textContent = `${Math.round(battery.v)}%`;
        batteryBar.style.setProperty('--bat', `${battery.v}%`);
        phone.classList.toggle('is-dying', battery.v < 15);
      },
    },
    0.4
  );
  // the chat can't hold it anymore: messages burst out all over the screen
  tl.to('.msg--fly', { opacity: 1, scale: 1, stagger: 0.09, duration: 0.2, ease: 'back.out(2.4)' }).to(
    phone,
    { x: 6, duration: 0.03, repeat: 9, yoyo: true },
    '<'
  );
  hold(tl, 0.4);
  tl.fromTo('.giant', { yPercent: 12 }, { yPercent: -12, duration: tl.duration(), immediateRender: false }, 0);
}

function fireScene(chars) {
  const tl = chapter('scene-fire');
  gsap.set(chars, { color: '#3a3330', textShadow: '0 0 0px rgba(255, 120, 40, 0)' });
  tl.from('.campfire', { scale: 0.2, opacity: 0, duration: 0.5, ease: 'back.out(1.6)', transformOrigin: '50% 100%' })
    .from('.fire__intro', { opacity: 0, duration: 0.25 }, '<')
    .to(chars, { color: '#ffe2bd', textShadow: '0 0 14px rgba(255, 120, 40, 0.85)', stagger: 0.025, duration: 0.2 })
    .to('.campfire', { scale: 1.25, duration: 0.6 }, '<');
  hold(tl, 0.4);
}

function rulesScene() {
  const tl = chapter('scene-rules');
  const slaps = $$('.slap');
  gsap.set(slaps, { opacity: 0, scale: 1.8, rotation: () => gsap.utils.random(-25, 25) });
  gsap.set('.slap--sealed .seal', { opacity: 0, scale: 2.6 });
  tl.from('.rules__h', { opacity: 0, duration: 0.3 });
  slaps.forEach((s) => {
    tl.to(s, { opacity: 1, scale: 1, rotation: 0, duration: 0.22, ease: 'power4.in' }).to('.wall', { x: 5, duration: 0.04, yoyo: true, repeat: 3 });
  });
  tl.to('.slap--sealed .seal', { opacity: 1, scale: 1, duration: 0.25, ease: 'power4.in' });
  hold(tl, 0.4);
}

export function initStory() {
  // works with or without motion
  const fill = $('.loadbar__fill');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => (fill.style.transform = `scaleX(${self.progress})`) });

  $$('section[data-mood]').forEach((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && (document.body.dataset.mood = section.dataset.mood),
    })
  );

  const burnChars = splitChars($('[data-burn]'));
  sizeTruths();
  ScrollTrigger.addEventListener('refreshInit', sizeTruths);

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // ── hero: the sign drops in on its chains
    gsap.from('.sign-drop', { y: -300, rotation: -8, duration: 1.7, ease: 'elastic.out(1, 0.45)', delay: 0.1 });
    gsap.from('.hero__sub, .hero .countdown, .hero__ctas', { y: 26, opacity: 0, stagger: 0.12, duration: 0.8, delay: 0.8, ease: 'power3.out' });
    gsap.to('.hero', {
      opacity: 0.1,
      scale: 0.94,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    phoneScene();

    // ── free-flowing scenes: headings tumble in
    $$('.scene__head').forEach((head) =>
      gsap.from(head.children, {
        y: 50,
        opacity: 0,
        rotation: () => gsap.utils.random(-5, 5),
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: head, start: 'top 82%', toggleActions: 'play none none reverse' },
      })
    );

    // ── truths slide sideways while you scroll down
    gsap.from('.truths__title', { opacity: 0, duration: 0.6, scrollTrigger: { trigger: '#scene-truths', start: 'top 70%', toggleActions: 'play none none reverse' } });
    gsap.to('.truths__track', {
      x: () => -Math.max(0, $('.truths__track').scrollWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: { trigger: '#scene-truths', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
    });

    fireScene(burnChars);
    rulesScene();

    // ── notice board + ledger
    gsap.from('.notices-section .section-head > *', {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.notices-section', start: 'top 75%' },
    });
    gsap.from('.notice', {
      y: -80,
      opacity: 0,
      rotation: (i) => (i % 2 ? 16 : -16),
      stagger: 0.12,
      duration: 1,
      ease: 'bounce.out',
      scrollTrigger: { trigger: '.notices', start: 'top 80%' },
    });
    gsap.from('.ledger__card', {
      y: 80,
      scale: 0.92,
      rotation: -2,
      opacity: 0,
      duration: 0.9,
      ease: 'back.out(1.3)',
      scrollTrigger: { trigger: '.ledger', start: 'top 75%' },
    });
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
