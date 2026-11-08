import { gsap } from 'gsap';

const arrivalLength = 2.55;
const arrivalProgress = 0.74;
const fadeLength = 0.72;
const quickFade = 0.16;

export function bindOpening({ onStart, onFinish }) {
  const root = document.documentElement;
  const opening = document.getElementById('opening');
  const portfolio = document.getElementById('portfolio');
  const canvas = document.getElementById('opening-bats');
  const title = document.getElementById('opening-title');
  const next = document.getElementById('skip-opening');
  const replay = document.getElementById('replay-opening');
  if (!opening || !portfolio || !title || !next) {
    delete root.dataset.opening;
    return false;
  }

  const smoke = opening.querySelector('.opening-smoke');
  const titleAccent = title.lastElementChild;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const flight = { progress: 0, elapsed: 0 };
  let timer = 0;
  let scene;
  let sceneScope;
  let restoreFocus;
  let paint;
  let active = false;
  let departing = false;

  function draw() {
    try {
      paint?.(flight.progress, flight.elapsed);
    } catch {
      paint = undefined;
      if (canvas) canvas.dataset.flockMode = 'static';
    }
  }

  function finish() {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    sceneScope?.revert();
    scene = undefined;
    sceneScope = undefined;
    flight.progress = 1;
    draw();
    portfolio.inert = false;
    delete root.dataset.opening;
    restoreFocus?.focus({ preventScroll: true });
    onFinish?.();
  }

  function ready() {
    if (!active || departing) return;
    clearTimeout(timer);
    flight.progress = arrivalProgress;
    flight.elapsed = arrivalLength;
    opening.dataset.stage = 'ready';
    root.dataset.opening = 'waiting';
    draw();
  }

  function restoreReadyScene() {
    if (!active || departing) return;
    sceneScope?.revert();
    scene = undefined;
    sceneScope = undefined;
    ready();
  }

  function leave(fast = false) {
    if (!active || departing) return;
    departing = true;
    scene?.pause();
    clearTimeout(timer);
    root.dataset.opening = 'leaving';
    opening.dataset.stage = 'dispersal';
    const duration = fast ? quickFade : fadeLength;
    timer = setTimeout(finish, duration * 1000 + 240);

    try {
      sceneScope ??= gsap.context(null, opening);
      sceneScope.add(() => gsap.timeline({ onComplete: finish })
        .to(flight, { progress: 1, elapsed: flight.elapsed + duration, duration, ease: 'none', onUpdate: draw }, 0)
        .to(title, { opacity: 0, duration: duration * 0.76, ease: 'power1.in' }, 0)
        .to(next, { opacity: 0, duration: duration * 0.55, ease: 'power1.out' }, 0)
        .to(opening, { opacity: 0, duration, ease: 'power2.inOut' }, 0));
    } catch {
      finish();
    }
  }

  function buildScene() {
    const style = getComputedStyle(opening);
    const highlight = style.getPropertyValue('--opening-highlight').trim() || '#f6eeee';
    const accent = style.getPropertyValue('--opening-highlight-accent').trim() || '#f5d5d9';

    sceneScope = gsap.context(null, opening);
    sceneScope.add(() => {
      gsap.set([opening, title, titleAccent, smoke, next].filter(Boolean), { transition: 'none' });
      gsap.set(opening, { opacity: 1 });
      gsap.set(title, {
        opacity: 0.24,
        '--opening-fill': '-10%',
        maskImage: 'linear-gradient(105deg, #000 calc(var(--opening-fill) - 11%), #0002 var(--opening-fill))',
      });
      scene = gsap.timeline({ paused: true, onComplete: ready });
      scene
        .to(flight, { progress: arrivalProgress, elapsed: arrivalLength, duration: arrivalLength, ease: 'none', onUpdate: draw }, 0)
        .call(() => { opening.dataset.stage = 'swarm'; }, [], 0.28)
        .call(() => { opening.dataset.stage = 'reveal'; }, [], 0.90)
        .to(title, { opacity: 1, duration: 1.34, ease: 'power1.out' }, 0.52)
        .to(title, { '--opening-fill': '120%', duration: 1.47, ease: 'sine.inOut' }, 0.94)
        .to(title, { color: highlight, duration: 0.89, ease: 'power2.out' }, 1.34);
      if (titleAccent) {
        scene.to(titleAccent, { color: accent, duration: 0.84, ease: 'power2.out' }, 1.39);
      }
      if (smoke) {
        scene.to(smoke, { opacity: 0.54, scale: 1.11, duration: 2.20, ease: 'sine.out' }, 0.16);
      }
    });
    scene.play();
  }

  function play(focusAfter) {
    if (active || motion.matches) return false;
    active = true;
    departing = false;
    restoreFocus = focusAfter;
    flight.progress = 0;
    flight.elapsed = 0;
    opening.dataset.stage = 'calm';
    root.dataset.opening = 'playing';
    portfolio.inert = true;
    onStart?.();
    title.focus({ preventScroll: true });
    if (!paint && canvas) {
      import('./bats.js').then(({ createOpeningFlock }) => {
        paint ??= createOpeningFlock(canvas, title);
        if (active) draw();
      }).catch(() => { canvas.dataset.flockMode = 'static'; });
    }
    timer = setTimeout(restoreReadyScene, arrivalLength * 1000 + 650);
    try {
      buildScene();
    } catch {
      restoreReadyScene();
    }
    return true;
  }

  function syncPreference() {
    if (replay) replay.hidden = motion.matches;
    if (motion.matches) finish();
  }

  replay?.addEventListener('click', () => play(replay));
  next.addEventListener('click', () => leave());
  opening.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      leave(true);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      next.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (root.dataset.opening === 'waiting') draw();
  }, { passive: true });
  document.fonts?.ready.then(() => {
    if (root.dataset.opening === 'waiting') draw();
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
