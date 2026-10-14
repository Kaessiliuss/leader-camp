import { CAMP } from './config.js';
import { send } from './submit.js';
import { burst, rain, shake, reducedMotion } from './fx.js';
import { downloadIcs } from './ics.js';

const flow = document.getElementById('flow');
const inner = flow.querySelector('.flow__inner');
// One response = one person. Nothing is remembered between responses.
const state = { reg: null, sure: 0, responseId: null };
const newResponseId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
let cleanup = null;

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const firstName = () => esc((state.reg?.name || 'legend').trim().split(/\s+/)[0]);
const rand = (min, max) => min + Math.random() * (max - min);

const gif = (name) => `${import.meta.env.BASE_URL}gifs/${name}.webp`;
const preload = (name) => {
  new Image().src = gif(name);
};
const meme = (name, plaque, alt) => `
  <figure class="frame meme">
    <img src="${gif(name)}" alt="${esc(alt)}" />
    <figcaption class="plaque">${plaque}</figcaption>
  </figure>`;

const SUGGESTIONS = [
  'Meetings that start late 🕐',
  'Who actually does what in the maîtrise',
  'The store room situation 💀',
  'Parents & the WhatsApp chaos',
  'The programme for this year',
  'Succession — who comes next?',
  'Money / budget',
  'How CUs and ACUs really split the work',
];

/* ───────── The five refusals ───────── */

// "I'm coming" grows with every refusal; "not coming" shrinks.
const GROW = [1, 1.3, 1.65, 2.05, 2.5];
const SHRINK = [1, 0.92, 0.84, 0.76, 0.64];
const TAUNTS = ['nope 🏃', 'too slow 🐢', 'over here!', "you'll never catch me", 'skill issue', 'lol, missed', 'almost! 😂', "ok… ok… I'm tired 😮‍💨"];

const NOPES = [
  {
    gif: 'rock-eyebrow',
    plaque: '« The Eyebrow » · artist unknown',
    alt: 'Dwayne Johnson slowly raising one eyebrow',
    title: 'Not coming? 🤨',
    sub: 'Maybe your thumb slipped. It happens to the best of us.',
    come: "Oops — I'm coming",
    sure: 'Still not coming',
    rain: ['💔', '🥲'],
  },
  {
    gif: 'omniman-are-you-sure',
    plaque: '« Are you sure? » · a father’s disappointment',
    alt: 'Omni-Man from Invincible asking "are you sure?"',
    title: 'Are you sure?',
    sub: 'Think of the machewe. Think of the candles. Think of us.',
    come: "Okay, I'm coming",
    sure: "Yes, I'm sure",
    rain: ['😢', '💔'],
  },
  {
    gif: 'this-is-fine',
    plaque: '« Your unit, without you » · still life with fire',
    alt: 'The "this is fine" dog sipping coffee in a burning room',
    title: 'Are you sure-sure?',
    sub: 'Your maîtrise will plan the whole year without you. It will be fine. Probably. 🔥',
    come: "Fine, I'll come",
    sure: 'Sure-sure',
    rain: ['🔥', '🥲'],
    jiggle: true,
  },
  {
    gif: 'plankton-never-catch-me',
    plaque: '« You’ll never catch me » · self-portrait of the button',
    alt: 'Plankton from SpongeBob shouting "You will never catch me, you hear?"',
    title: 'Fine. Click “not coming”.',
    sub: 'If you can catch it.',
    come: "I'm coming 🫡",
    sure: 'Not coming',
    rain: ['💨', '🏃'],
    runaway: true,
  },
  {
    gif: 'puss-please',
    plaque: '« Please » · oil on heartstrings',
    alt: 'Puss in Boots making huge pleading eyes',
    title: 'Last chance. Absolutely, certifiably sure?',
    sub: 'We made TIME for you. The clocks literally go back that night. That is a whole extra hour of camp.',
    come: "OKAY I'M COMING 🫡",
    sure: 'yes… 😔',
    rain: ['🥺', '😢'],
  },
];

/* ───────── Plumbing ───────── */

function open(html, onMount) {
  cleanup?.();
  cleanup = null;
  flow.hidden = false;
  document.documentElement.classList.add('flow-open');
  inner.innerHTML = html;
  flow.scrollTop = 0;
  const heading = inner.querySelector('h2');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  onMount?.(inner);
}

function close() {
  cleanup?.();
  cleanup = null;
  flow.hidden = true;
  document.documentElement.classList.remove('flow-open');
  inner.innerHTML = '';
  // the next person starts from a blank ledger
  const form = document.getElementById('ready-form');
  form.reset();
  form.querySelector('.form-error').hidden = true;
  Object.assign(state, { reg: null, sure: 0, responseId: null });
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast glass';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 7000);
}

const netCheck = (res) => {
  if (!res.ok) toast("Couldn't reach the server 😬 Screenshot this and send it to the CG.");
};

function register(attending, note = '') {
  const r = (state.reg = { ...state.reg, attending });
  send('registration', {
    responseId: state.responseId,
    name: r.name,
    lane: r.lane,
    role: r.role,
    phone: r.phone,
    diet: r.diet,
    attending,
    areYouSureClicks: state.sure,
    note,
  }).then(netCheck);
}

/* ───────── Topics block (shared by yes / no) ───────── */

function topicBlock({ heading, sub, skipLabel }) {
  return `
    <div class="topics">
      <h3>${heading}</h3>
      <p class="muted">${sub}</p>
      <div class="suggest">
        ${SUGGESTIONS.map((s) => `<button type="button" class="suggest__btn" data-suggest="${esc(s)}">+ ${esc(s)}</button>`).join('')}
      </div>
      <label class="sr-only" for="topic-text">What needs to be discussed</label>
      <textarea id="topic-text" rows="5" maxlength="2000" placeholder="Be honest. Nobody gets thrown out of the tavern for this one."></textarea>
      <p class="form-error" role="alert" hidden></p>
      <div class="actions">
        <button type="button" class="btn btn--brass" data-send>Put it on the table</button>
        <button type="button" class="btn btn--ghost" data-skip>${skipLabel}</button>
      </div>
    </div>`;
}

function wireTopics(root, attending, onDone) {
  const textarea = root.querySelector('textarea');
  const error = root.querySelector('.topics .form-error');

  root.querySelectorAll('[data-suggest]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const line = `• ${btn.dataset.suggest}`;
      if (!textarea.value.includes(line)) textarea.value = (textarea.value.trim() ? `${textarea.value.trim()}\n` : '') + line;
      btn.classList.add('is-on');
    })
  );

  root.querySelector('[data-send]').addEventListener('click', (e) => {
    const topic = textarea.value.trim();
    if (!topic) {
      error.textContent = 'An empty page. Very mysterious of you — but write something.';
      error.hidden = false;
      shake(textarea);
      return;
    }
    send('topic', { responseId: state.responseId, name: state.reg?.name, attending, topic }).then(netCheck);
    burst(['🕯️', '✨', '🪙'], { x: e.clientX, y: e.clientY, count: 28 });
    onDone(false);
  });

  root.querySelector('[data-skip]').addEventListener('click', () => onDone(true));
}

/* ───────── YES path ───────── */

function screenAccepted(mode = 'straight') {
  const lead = {
    straight: `Your chair is waiting. <b>${esc(CAMP.when.split(' →')[0])}</b> at ${esc(CAMP.place)}. Bring your loyalty. Undying, preferably.`,
    convinced: `It only took ${state.sure} refusal${state.sure === 1 ? '' : 's'}. Character development. 👏`,
    comeback: 'Look who came crawling back. Respect. Real loyalty energy. 🫡',
  }[mode];
  const art =
    mode === 'straight'
      ? meme('oprah-welcome', '« Welcome to the team » · Oprah, about you', 'Oprah shouting "Welcome to the team!" under confetti')
      : meme('one-of-us', '« One of us » · the whole maîtrise, chanting', 'People banging a table chanting "One of us! One of us!"');

  open(
    `<div class="screen screen--yes">
      <span class="seal gg-seal" aria-hidden="true"><span>GG</span></span>
      <div class="card glass glass--liquid studs">
        ${art}
        <h2>Welcome to the table, ${firstName()}.&nbsp;🫡</h2>
        <p class="lead">${lead}</p>
        <hr />
        ${topicBlock({
          heading: 'Before the draft: what needs to be discussed?',
          sub: 'The weekend ends around the table, with one long, honest talk about last year and the year ahead. What has to be on it?',
          skipLabel: 'Nothing for now',
        })}
      </div>
    </div>`,
    (root) => wireTopics(root, 'yes', (skipped) => screenOnTheTable(skipped))
  );
  burst(['🎉', '✨', '🕯️', '🪙']);
}

function screenTopicsOnly() {
  const attending = state.reg?.attending === 'no' ? 'no' : 'yes';
  open(
    `<div class="screen">
      <div class="card glass glass--liquid studs">
        <p class="kicker">The table</p>
        <h2>Got something for the table, ${firstName()}?</h2>
        ${topicBlock({
          heading: 'What needs to be discussed?',
          sub: 'Anything about last year or the year ahead. Big or small — the small ones usually matter most.',
          skipLabel: 'Never mind',
        })}
      </div>
    </div>`,
    (root) => wireTopics(root, attending, (skipped) => (skipped ? close() : attending === 'yes' ? screenOnTheTable(false) : screenNopeDone(false)))
  );
}

function screenOnTheTable(skipped) {
  open(
    `<div class="screen">
      <div class="card glass glass--liquid studs">
        <span class="big-emoji" aria-hidden="true">${skipped ? '🫡' : '🕯️'}</span>
        <p class="kicker">${skipped ? 'See you there' : 'Noted'}</p>
        <h2>${skipped ? 'See you on Saturday.' : 'It’s on the table.'}</h2>
        <p class="lead">${
          skipped
            ? 'If something comes up before then, come back and add it here.'
            : 'It will be discussed. Sealed in wax, no take-backs.'
        }</p>
        <p class="when-line">${esc(CAMP.when)} · ${esc(CAMP.place)}, ${esc(CAMP.town)}</p>
        <div class="actions actions--center">
          <button type="button" class="btn btn--brass" data-ics>Add to calendar</button>
          <button type="button" class="btn btn--glass" data-more>Add ${skipped ? 'a' : 'another'} topic</button>
          <button type="button" class="btn btn--ghost" data-close>Back to the tavern</button>
        </div>
      </div>
    </div>`,
    (root) => {
      root.querySelector('[data-ics]').addEventListener('click', downloadIcs);
      root.querySelector('[data-more]').addEventListener('click', screenTopicsOnly);
      root.querySelector('[data-close]').addEventListener('click', close);
    }
  );
}

/* ───────── NO path ───────── */

function screenNope(i) {
  const n = NOPES[i];
  preload(NOPES[i + 1]?.gif ?? 'skinner-pathetic');
  open(
    `<div class="screen screen--nope" data-step="${i}">
      <div class="card glass studs">
        ${meme(n.gif, n.plaque, n.alt)}
        <h2>${n.title}</h2>
        <p class="lead">${n.sub}</p>
        <div class="nope__actions">
          <button type="button" class="btn btn--brass nope__come">${n.come}</button>
          <button type="button" class="btn btn--wine nope__sure${n.jiggle ? ' is-jiggling' : ''}">${n.sure}</button>
        </div>
        ${n.runaway ? '<p class="catch-stats">Attempts: <b data-attempts>0</b> · Catches: <b>0</b></p>' : ''}
      </div>
    </div>`,
    (root) => {
      const come = root.querySelector('.nope__come');
      const sure = root.querySelector('.nope__sure');

      // grow "I'm coming" from last screen's size to this one's, so you see it swell
      come.style.setProperty('--grow', GROW[Math.max(0, i - 1)]);
      sure.style.setProperty('--shrink', SHRINK[i]);
      requestAnimationFrame(() => requestAnimationFrame(() => come.style.setProperty('--grow', GROW[i])));

      const refuse = () => {
        state.sure++;
        shake(flow);
        rain(n.rain);
        if (state.sure >= NOPES.length) screenSurrender();
        else screenNope(state.sure);
      };

      come.addEventListener('click', () => {
        register('yes', `convinced after ${state.sure} refusal(s)`);
        screenAccepted('convinced');
      });

      if (!n.runaway) {
        sure.addEventListener('click', refuse);
        return;
      }
      cleanup = makeRunaway(sure, come, root.querySelector('[data-attempts]'), i, refuse);
    }
  );
}

/** The "not coming" button that escapes across the whole screen until it gets tired. */
function makeRunaway(btn, come, attempts, step, refuse) {
  let dodges = 0;
  let lastDodge = 0;
  let justDodged = false;

  const puff = (x, y) => {
    if (reducedMotion()) return;
    const p = document.createElement('span');
    p.className = 'puff';
    p.textContent = '💨';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    flow.appendChild(p);
    setTimeout(() => p.remove(), 700);
  };

  const detach = () => {
    const r = btn.getBoundingClientRect();
    btn.classList.add('runaway');
    btn.style.left = `${r.left}px`;
    btn.style.top = `${r.top}px`;
    flow.appendChild(btn);
    void btn.offsetWidth; // commit the starting spot so the jump animates
  };

  const overlaps = (x, y, w, h, r, pad = 16) =>
    x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad;

  const jump = () => {
    const w = btn.offsetWidth;
    const h = btn.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const side = Math.min(70, Math.max(12, (vw - w) / 2)); // room for the taunt bubble
    const cur = btn.getBoundingClientRect();
    const avoid = come.getBoundingClientRect();
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 30; tries++) {
      x = rand(side, Math.max(side, vw - w - side));
      y = rand(70, Math.max(70, vh - h - 16));
      const far = Math.hypot(x - cur.left, y - cur.top) > Math.min(vw, vh) * 0.35;
      if (far && !overlaps(x, y, w, h, avoid)) break;
    }
    puff(cur.left + cur.width / 2, cur.top + cur.height / 2);
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.transform = `rotate(${rand(-14, 14)}deg) scale(${rand(0.9, 1.12)})`;
  };

  const dodge = () => {
    if (dodges >= TAUNTS.length) {
      btn.dataset.taunt = 'fine. you got me. 😮‍💨';
      btn.style.transform = 'rotate(0deg) scale(1)';
      return false;
    }
    if (!btn.classList.contains('runaway')) detach();
    btn.dataset.taunt = TAUNTS[dodges];
    dodges++;
    lastDodge = performance.now();
    attempts.textContent = dodges;
    // every attempt at "not coming" makes "I'm coming" a little bigger still
    come.style.setProperty('--grow', GROW[step] + dodges * 0.07);
    jump();
    return true;
  };

  // mouse: it runs before you even reach it
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || performance.now() - lastDodge < 260) return;
    const r = btn.getBoundingClientRect();
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    if (Math.hypot(dx, dy) < 46) dodge();
  };
  // touch: it jumps the moment your finger lands
  const onDown = (e) => {
    if (e.pointerType === 'mouse') return;
    if (dodge()) {
      justDodged = true;
      e.preventDefault();
      setTimeout(() => (justDodged = false), 450);
    }
  };
  const onClick = () => {
    if (justDodged) return;
    if (dodge()) return;
    refuse();
  };

  window.addEventListener('pointermove', onMove);
  btn.addEventListener('pointerdown', onDown);
  btn.addEventListener('click', onClick);

  return () => {
    window.removeEventListener('pointermove', onMove);
    btn.remove();
  };
}

function screenSurrender() {
  register('no');
  open(
    `<div class="screen screen--surrender">
      <div class="card glass glass--liquid studs">
        ${meme('skinner-pathetic', '« Pathetic » · portrait of you, today', 'Principal Skinner saying "Pathetic"')}
        <h2 class="surrender__cap">OK. We surrender.</h2>
        <p class="pathetic">You are officially <mark>pathetic</mark>. 💀</p>
        <p class="muted">Five refusals. Your chair has been given to a very confused stray cat. Your maîtrise has been notified. Nobody is surprised.</p>
        <hr />
        ${topicBlock({
          heading: "But hey — you're still a leader.",
          sub: "Is there something you think needs to be discussed? We'll bring it to the table without you.",
          skipLabel: 'Nope, nothing',
        })}
        <button type="button" class="link-btn" data-mind>…okay wait, I changed my mind 🙈</button>
      </div>
    </div>`,
    (root) => {
      wireTopics(root, 'no', (skipped) => screenNopeDone(skipped));
      root.querySelector('[data-mind]').addEventListener('click', changedMind);
    }
  );
  rain(['💀', '🏳️'], 22);
}

function screenNopeDone(skipped) {
  open(
    `<div class="screen">
      <div class="card glass glass--liquid studs">
        <span class="big-emoji" aria-hidden="true">👋</span>
        <p class="kicker">${skipped ? 'Silent treatment' : 'Message delivered'}</p>
        <h2>${skipped ? 'Not even one topic? Mysterious.' : "We'll discuss it without you."}</h2>
        <p class="lead">${skipped ? 'Fine. GG.' : 'Your candle stays unlit. GG.'}</p>
        <div class="actions actions--center">
          <button type="button" class="btn btn--brass" data-mind>I changed my mind — I'm coming 🙈</button>
          <button type="button" class="btn btn--ghost" data-close>Back to the tavern</button>
        </div>
      </div>
    </div>`,
    (root) => {
      root.querySelector('[data-mind]').addEventListener('click', changedMind);
      root.querySelector('[data-close]').addEventListener('click', close);
    }
  );
}

function changedMind() {
  register('yes', 'changed mind after declining');
  screenAccepted('comeback');
}

/* ───────── The ledger form ───────── */

function readForm(form) {
  const fd = new FormData(form);
  const data = {
    name: String(fd.get('name') || '').trim(),
    lane: String(fd.get('lane') || ''),
    role: String(fd.get('role') || ''),
    phone: String(fd.get('phone') || '').trim(),
    diet: String(fd.get('diet') || '').trim(),
  };
  const error = form.querySelector('.form-error');
  let message = '';
  if (data.name.length < 2) message = 'The ledger needs a name. Even the quiet one in the corner has a name.';
  else if (!data.lane) message = 'Pick a lane. Literally.';
  if (message) {
    error.textContent = message;
    error.hidden = false;
    shake(form.closest('.ledger__card'));
    (data.name.length < 2 ? form.elements.name : form.querySelector('input[name=lane]')).focus();
    return null;
  }
  error.hidden = true;
  return data;
}

export function initRegistration() {
  const form = document.getElementById('ready-form');
  form.addEventListener('submit', (e) => e.preventDefault());

  const start = () => {
    const data = readForm(form);
    if (!data) return false;
    Object.assign(state, { reg: data, sure: 0, responseId: newResponseId() });
    return true;
  };

  form.querySelector('[data-action=accept]').addEventListener('click', (e) => {
    if (!start()) return;
    burst(['🎉', '✨', '🕯️'], { x: e.clientX, y: e.clientY, count: 30 });
    register('yes');
    screenAccepted('straight');
  });

  form.querySelector('[data-action=decline]').addEventListener('click', () => {
    if (!start()) return;
    screenNope(0);
  });

  // warm up the first GIFs of either path while they're still reading the ledger
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) {
      preload('oprah-welcome');
      preload('rock-eyebrow');
      io.disconnect();
    }
  }).observe(document.getElementById('ledger'));
}
