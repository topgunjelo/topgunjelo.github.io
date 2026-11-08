import { bindOpening } from './opening.js';
import { initPortfolioMotion } from './motion.js';

const navigation = [...document.querySelectorAll('[data-site-nav] a')];
const canvas = document.querySelector('#bats');
const folders = document.querySelector('.project-folders');
let bats;

if (folders) {
  const openLinkedFolder = () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.matches('[data-project-folder]')) target.open = true;
  };
  openLinkedFolder();
  addEventListener('hashchange', openLinkedFolder);
  folders.addEventListener('toggle', event => {
    const folder = event.target;
    if (folder.matches('[data-project-folder]') && folder.open) {
      bats?.burst(folder.querySelector('.folder-art'));
    }
  }, true);
}

if (navigation.length) {
  const sections = [...new Set(navigation.map(link => link.hash))]
    .map(hash => document.getElementById(hash.slice(1))).filter(Boolean);
  let scrollFrame = 0;
  function updateNavigation() {
    scrollFrame = 0;
    const active = sections.findLast(section => section.getBoundingClientRect().top <= innerHeight * .32);
    const hash = '#' + (scrollY < 40 ? 'home' : active?.id || 'home');
    for (const link of navigation) {
      if (link.hash === hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  function queueNavigation() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
  }
  updateNavigation();
  addEventListener('scroll', queueNavigation, { passive: true });
  addEventListener('resize', queueNavigation, { passive: true });
}

if (canvas) {
  let generation = 0;
  function startBats() {
    if (bats || document.documentElement.hasAttribute('data-opening')) return;
    const load = ++generation;
    import('./bats.js').then(({ initBats }) => {
      if (load === generation) bats = initBats(canvas);
    }).catch(() => { canvas.dataset.batMode = 'static'; });
  }
  function stopBats() {
    generation++;
    bats?.destroy();
    bats = undefined;
  }
  let bitsStarted = false;
  function startPortfolioEffects() {
    startBats();
    if (bitsStarted || !document.querySelector('[data-react-bits]')) return;
    bitsStarted = true;
    import('./bits.jsx').then(({ initReactBits }) => initReactBits()).catch(() => {
      bitsStarted = false;
    });
  }
  if (!bindOpening({ onStart: stopBats, onFinish: startPortfolioEffects })) {
    if ('requestIdleCallback' in window) requestIdleCallback(startPortfolioEffects, { timeout: 600 });
    else setTimeout(startPortfolioEffects, 100);
  }
  initPortfolioMotion();
}


