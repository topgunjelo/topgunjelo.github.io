import { gsap } from 'gsap';

const sceneLength = 4.2;
const fadeLength = 0.56;
const quickFade = 0.15;

export function bindOpening({ onStart, onFinish }) {
  const root = document.documentElement;
  const opening = document.getElementById('opening');
  const portfolio = document.getElementById('portfolio');
  const canvas = document.getElementById('opening-bats');
  const title = document.getElementById('opening-title');
  const skip = document.getElementById('skip-opening');
  const replay = document.getElementById('replay-opening');
  if (!opening || !portfolio || !title || !skip) {
    delete root.dataset.opening;
    return false;
  }

  const smoke = opening.querySelector('.opening-smoke');
  const titleAccent = title.lastElementChild;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let failsafe = 0;
  let scene;
  let sceneScope;
  let restoreFocus;
  let paint;
  let active = false;

  function finish() {
    if (!active) return;
    active = false;
    clearTimeout(failsafe);
    sceneScope?.revert();
    scene = undefined;
    sceneScope = undefined;
    paint?.(1, sceneLength);
    portfolio.inert = false;
    delete root.dataset.opening;
    restoreFocus?.focus({ preventScroll: true });
    onFinish?.();
  }

  function skipNow() {
    if (!active || root.dataset.opening === 'skipping') return;
    scene?.pause();
    root.dataset.opening = 'skipping';
    sceneScope.add(() => gsap.to(opening, {
      opacity: 0, duration: quickFade, ease: 'power1.out', onComplete: finish,
    }));
  }

  function buildScene() {
    const style = getComputedStyle(opening);
    const highlight = style.getPropertyValue('--opening-highlight').trim() || '#f6eeee';
    const accent = style.getPropertyValue('--opening-highlight-accent').trim() || '#f5d5d9';

    sceneScope = gsap.context(() => {
      gsap.set([opening, title, titleAccent, smoke].filter(Boolean), { transition: 'none' });
      gsap.set(opening, { opacity: 1 });
      const reveal = sceneLength * 0.45;
      const dispersal = sceneLength * 0.68;
      const fade = sceneLength - fadeLength;
      scene = gsap.timeline({
        paused: true,
        onUpdate() {
          if (active) paint?.(this.time() / sceneLength, this.time());
        },
        onComplete: finish,
      });
      scene
        .call(() => { opening.dataset.stage = 'swarm'; }, [], sceneLength * 0.16)
        .call(() => { opening.dataset.stage = 'reveal'; }, [], reveal)
        .call(() => { opening.dataset.stage = 'dispersal'; }, [], dispersal)
        .to(title, { color: highlight, scale: 1, duration: 0.78, ease: 'power3.out' }, reveal - 0.10)
        .to(title, { opacity: 0.55, scale: 1.045, duration: fadeLength, ease: 'power2.out' }, fade)
        .call(() => { root.dataset.opening = 'leaving'; }, [], fade)
        .to(opening, { opacity: 0, duration: fadeLength, ease: 'power2.inOut' }, fade);

      if (titleAccent) {
        scene.to(titleAccent, { color: accent, duration: 0.72, ease: 'power2.out' }, reveal - 0.10);
      }
      if (smoke) {
        scene
          .to(smoke, { opacity: 0.42, scale: 1.095, duration: 1.22, ease: 'sine.inOut' }, 0.12)
          .to(smoke, { opacity: 0.61, scale: 1.135, duration: 1.12, ease: 'sine.inOut' }, 1.34)
          .to(smoke, { opacity: 0.46, scale: 1.20, duration: 1.59, ease: 'sine.inOut' }, 2.46);
      }
    }, opening);
    scene.play();
  }

  function play(focusAfter) {
    if (active || motion.matches) return false;
    active = true;
    restoreFocus = focusAfter;
    opening.dataset.stage = 'calm';
    root.dataset.opening = 'playing';
    portfolio.inert = true;
    onStart?.();
    title.focus({ preventScroll: true });
    if (!paint && canvas) {
      import('./bats.js').then(({ createOpeningFlock }) => {
        paint ??= createOpeningFlock(canvas);
      }).catch(() => { canvas.dataset.flockMode = 'static'; });
    }
    failsafe = setTimeout(finish, sceneLength * 1000 + 700);
    buildScene();
    return true;
  }

  function syncPreference() {
    if (replay) replay.hidden = motion.matches;
    if (motion.matches) finish();
  }

  replay?.addEventListener('click', () => play(replay));
  skip.addEventListener('click', skipNow);
  opening.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      skipNow();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      skip.focus();
    }
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) finish();
  });
  window.addEventListener('hashchange', () => {
    if (location.hash) finish();
  });
  motion.addEventListener('change', syncPreference);
  syncPreference();
  if (root.dataset.opening === 'pending' && play(document.getElementById('hero-title'))) {
    return true;
  }
  delete root.dataset.opening;
  return false;
}

