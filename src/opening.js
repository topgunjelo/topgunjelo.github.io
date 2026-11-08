const sceneLength = 4200;
const fadeLength = 560;
const quickFade = 145;

export function bindOpening({ onStart, onFinish }) {
  const root = document.documentElement;
  const opening = document.getElementById('opening');
  if (!opening) return false;

  const portfolio = document.getElementById('portfolio');
  const canvas = document.getElementById('opening-bats');
  const title = document.getElementById('opening-title');
  const skip = document.getElementById('skip-opening');
  const replay = document.getElementById('replay-opening');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let failsafe = 0;
  let skipTimer = 0;
  let startedAt = 0;
  let restoreFocus;
  let paint;
  let active = false;

  function finish() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(frame);
    clearTimeout(failsafe);
    clearTimeout(skipTimer);
    paint?.(1, sceneLength / 1000);
    portfolio.inert = false;
    delete root.dataset.opening;
    restoreFocus?.focus({ preventScroll: true });
    onFinish();
  }

  function skipNow() {
    if (!active || root.dataset.opening === 'skipping') return;
    cancelAnimationFrame(frame);
    root.dataset.opening = 'skipping';
    skipTimer = setTimeout(finish, quickFade);
  }

  function draw(now) {
    const elapsed = Math.max(0, now - startedAt);
    const progress = Math.min(elapsed / sceneLength, 1);
    const stage = progress < .16 ? 'calm' : progress < .40 ? 'swarm'
      : progress < .69 ? 'reveal' : 'dispersal';
    if (opening.dataset.stage !== stage) opening.dataset.stage = stage;
    paint?.(progress, elapsed / 1000);

    if (elapsed >= sceneLength) {
      finish();
      return;
    }
    if (elapsed >= sceneLength - fadeLength && root.dataset.opening !== 'leaving') {
      root.dataset.opening = 'leaving';
    }
    frame = requestAnimationFrame(draw);
  }

  function play(focusAfter) {
    if (active || motion.matches) return false;
    active = true;
    restoreFocus = focusAfter;
    opening.dataset.stage = 'calm';
    root.dataset.opening = 'playing';
    portfolio.inert = true;
    onStart();
    title.focus({ preventScroll: true });
    startedAt = performance.now();
    if (!paint) {
      import('./bats.js').then(({ createOpeningFlock }) => {
        paint ??= createOpeningFlock(canvas);
      }).catch(() => { canvas.dataset.flockMode = 'static'; });
    }
    frame = requestAnimationFrame(draw);
    failsafe = setTimeout(finish, sceneLength + 700);
    return true;
  }

  function syncPreference() {
    replay.hidden = motion.matches;
    if (motion.matches) finish();
  }

  replay.addEventListener('click', () => play(replay));
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
  motion.addEventListener('change', syncPreference);
  syncPreference();
  if (root.dataset.opening === 'pending' && play(document.getElementById('hero-title'))) {
    return true;
  }
  delete root.dataset.opening;
  return false;
}

