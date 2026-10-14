import './style.css';
import { initAmbience } from './ambience.js';
import { initDetails } from './details.js';
import { initAlive } from './alive.js';
import { initStory } from './story.js';
import { initStore } from './store.js';
import { initDarkwall } from './darkwall.js';
import { initRegistration } from './flow.js';

// Real refraction through SVG backdrop filters only works in Chromium; everyone else gets frosted glass.
const brands = navigator.userAgentData?.brands ?? [];
if (brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand))) {
  document.documentElement.classList.add('lg-refract');
}

initAmbience();
initDetails();
initAlive();
initStory();
initStore();
initDarkwall();
initRegistration();
