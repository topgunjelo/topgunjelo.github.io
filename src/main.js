import { bindOpening } from './opening.js';

const navigation = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a')];
const menu = document.querySelector('.mobile-menu');
const hero = document.querySelector('.hero');
const canvas = document.querySelector('#bats');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let bats;

if (menu) {
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
}

if (hero) {
  const sections = [...new Set(navigation.map(link => link.hash))]
    .map(hash => document.getElementById(hash.slice(1))).filter(Boolean);
  let scrollFrame = 0;
  function updateNavigation() {
    scrollFrame = 0;
    const active = sections.findLast(section => section.getBoundingClientRect().top <= innerHeight * .32);
    const hash = '#' + (active?.id || 'home');
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

  if (matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', event => {
      if (reduced.matches) return;
      const box = hero.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width - .5) * 21;
      const y = ((event.clientY - box.top) / box.height - .5) * 12;
      hero.style.setProperty('--scene-x', x.toFixed(1) + 'px');
      hero.style.setProperty('--scene-y', y.toFixed(1) + 'px');
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      hero.style.removeProperty('--scene-x');
      hero.style.removeProperty('--scene-y');
    }, { passive: true });
  }
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
  if (!bindOpening({ onStart: stopBats, onFinish: startBats })) {
    if ('requestIdleCallback' in window) requestIdleCallback(startBats, { timeout: 600 });
    else setTimeout(startBats, 100);
  }

  let navigatingCase = false;
  addEventListener('pageshow', () => { navigatingCase = false; });
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-case-link]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        reduced.matches || canvas.dataset.batMode !== 'animated') return;
    event.preventDefault();
    if (navigatingCase) return;
    navigatingCase = true;
    const visual = link.closest('.project')?.querySelector('[data-bat-reveal]');
    bats.burst(visual);
    setTimeout(() => location.assign(link.href), 510);
  });
}


