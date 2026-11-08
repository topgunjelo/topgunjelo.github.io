const sectionSelector = '[data-bat-section]';
const desktopCount = 34;
const mobileCount = 17;
const tau = 2 * Math.PI;

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const wrap = (value) => value - Math.floor(value);

function smoothstep(start, end, value) {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
}

function envelope(progress, start, peak, release, end) {
  return smoothstep(start, peak, progress) * (1 - smoothstep(release, end, progress));
}

function randomSource(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const random = randomSource(718913);
const flock = Array.from({ length: desktopCount }, (_, index) => ({
  lane: index % 3,
  lead: random(),
  depth: random() ** 1.7,
  height: (random() - 0.5) * 0.12,
  phase: random() * tau,
  stride: random(),
  skew: (random() - 0.5) * 0.20,
  ember: index % 6 === 0,
}));
const fragments = Array.from({ length: 96 }, () => ({
  x: random(),
  y: random(),
  flicker: random() * tau,
  size: 0.65 + random() * 1.6,
}));

function wing(context, side, beat) {
  const span = 0.68 + 0.32 * Math.sqrt(Math.max(0, 1 - beat * beat));
  const tip = beat * 0.54;
  const wrist = beat * 0.28;
  const bend = beat * 0.09;
  context.moveTo(side * 0.055, -0.065);
  context.bezierCurveTo(side * 0.16, -0.16, side * 0.28, -0.13 + bend, side * 0.38 * span, -0.22 + bend);
  context.bezierCurveTo(side * 0.59 * span, -0.44 + wrist, side * 0.80 * span, -0.39 + tip, side * span, -0.18 + tip);
  context.quadraticCurveTo(side * 0.79 * span, -0.12 + tip, side * 0.69 * span, 0.14 + wrist);
  context.quadraticCurveTo(side * 0.55 * span, 0.013 + wrist, side * 0.44 * span, 0.23 + bend);
  context.quadraticCurveTo(side * 0.34 * span, 0.105 + bend, side * 0.25 * span, 0.28);
  context.quadraticCurveTo(side * 0.13, 0.16, side * 0.06, 0.27);
  context.closePath();
}

function silhouette(context, x, y, radius, angle, beat, bank, opacity, rim) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.scale(radius, radius);
  context.globalAlpha = opacity;
  context.fillStyle = '#080507';
  context.beginPath();
  wing(context, -1, clamp(beat - bank, -1, 1));
  wing(context, 1, clamp(beat + bank, -1, 1));
  context.fill();
  if (rim > 0) {
    context.globalAlpha = opacity * rim;
    context.strokeStyle = '#9e3947';
    context.lineWidth = Math.min(0.08, 0.62 / radius);
    context.stroke();
  }

  context.globalAlpha = opacity;
  context.beginPath();
  context.moveTo(-0.09, -0.03);
  context.quadraticCurveTo(-0.105, -0.125, -0.085, -0.19);
  context.quadraticCurveTo(-0.041, -0.165, -0.036, -0.124);
  context.quadraticCurveTo(0.001, -0.143, 0.042, -0.12);
  context.quadraticCurveTo(0.068, -0.181, 0.100, -0.178);
  context.quadraticCurveTo(0.099, -0.09, 0.103, -0.027);
  context.quadraticCurveTo(0.14, 0.15, 0.004, 0.36);
  context.quadraticCurveTo(-0.127, 0.17, -0.09, -0.03);
  context.fill();
  context.restore();
}

function drawFragments(context, rect, time, disintegrate, reconstruct, mobile) {
  const strength = Math.max(disintegrate, reconstruct);
  if (strength < 0.006) return;
  const { left, top, width, height } = rect;
  const count = mobile ? 38 : fragments.length;
  const sweepX = left + width * (1.03 - 1.04 * disintegrate);

  context.save();
  for (let index = 0; index < count; index += 1) {
    const fragment = fragments[index];
    const pulse = 0.6 + 0.4 * Math.sin(time * 6 + fragment.flicker);
    const lane = Math.floor(fragment.y * 6) / 5;
    const targetY = top + height * (0.15 + lane * 0.70);
    const scatterX = left + width * fragment.x - (11 + 48 * fragment.y) * disintegrate;
    const scatterY = top + height * fragment.y + (fragment.x - 0.4) * 85 * disintegrate;
    const x = mix(scatterX, left + width * fragment.x, reconstruct);
    const y = mix(scatterY, targetY, reconstruct);
    context.globalAlpha = strength * pulse * (index % 6 === 0 ? 0.62 : 0.37);
    context.fillStyle = index % 6 === 0 ? '#cf3949' : '#46141b';
    context.fillRect(x, y, fragment.size * (1 + 3 * disintegrate), fragment.size * 0.68);
  }

  context.strokeStyle = '#b43042';
  context.globalAlpha = disintegrate * 0.38;
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(sweepX, top + 0.18 * height);
  context.lineTo(sweepX - 24, top + 0.79 * height);
  context.stroke();

  context.globalAlpha = reconstruct * 0.43;
  context.beginPath();
  context.moveTo(left, top + 12);
  context.lineTo(left, top);
  context.lineTo(left + 16, top);
  context.moveTo(left + width - 16, top + height);
  context.lineTo(left + width, top + height);
  context.lineTo(left + width, top + height - 12);
  context.stroke();
  context.restore();
}

export function initBats(canvas) {
  const disabled = { burst() {}, destroy() {} };
  if (!canvas) return disabled;
  canvas.dataset.batMode = 'static';
  canvas.dataset.batPhase = 'calm';
  let context;
  try {
    context = canvas.getContext('2d', { alpha: true });
  } catch {
    return disabled;
  }
  if (!context) return disabled;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(pointer: coarse)');
  const events = new AbortController();
  const options = { passive: true, signal: events.signal };
  let frame = 0;
  let previous = 0;
  let time = 0;
  let width = 1;
  let height = 1;
  let mobile = false;
  let needsMeasure = true;
  let sections = [];
  let scroll = window.scrollY;
  let lastScroll = scroll;
  let lastInput = -Infinity;
  let wind = 0;
  let pointer = 0;
  let targetPointer = 0;
  let burstAt = -Infinity;
  let burstElement = null;
  let activeReveal = null;
  let painted = false;

  function clearReveal() {
    if (!activeReveal) return;
    activeReveal.style.removeProperty('--bat-disintegration');
    activeReveal.style.removeProperty('--bat-reconstruction');
    activeReveal = null;
  }

  function resize() {
    needsMeasure = true;
  }

  function measure() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    mobile = width < 760 || touch.matches;
    const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.55);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    sections = Array.from(document.querySelectorAll(sectionSelector), (section) => {
      const bounds = section.getBoundingClientRect();
      return {
        top: bounds.top + scroll,
        bottom: bounds.bottom + scroll,
        reveal: section.querySelector('[data-bat-reveal]'),
        contact: section.id === 'contact',
      };
    });
    needsMeasure = false;
  }

  function draw(timestamp) {
    frame = requestAnimationFrame(draw);
    const elapsed = previous ? timestamp - previous : 17;
    if (elapsed < (mobile ? 31 : 15)) return;
    previous = timestamp;
    const step = Math.min(50, elapsed) / 1000;
    time += step;
    if (needsMeasure) measure();
    const ease = 1 - Math.exp(-step * 7);
    pointer += (targetPointer - pointer) * ease;
    wind += (clamp((scroll - lastScroll) / (height * step), -1, 1) - wind) * ease;
    lastScroll = scroll;

    let progress = 0;
    let nearest = Infinity;
    let contact = 0;
    let reveal = null;
    for (let index = 1; index < sections.length; index += 1) {
      const section = sections[index];
      const position = (section.top - scroll) / height;
      const distance = Math.abs(position - 0.43);
      if (position > 0.10 && position < 0.84 && distance < nearest) {
        progress = (0.84 - position) / 0.74;
        nearest = distance;
        reveal = section.reveal;
      }
      if (section.contact) {
        contact = (1 - smoothstep(0.12, 0.62, position))
          * smoothstep(0.09, 0.45, (section.bottom - scroll) / height);
      }
    }

    const burstProgress = (timestamp - burstAt) / 660;
    const bursting = burstProgress >= 0 && burstProgress < 1;
    if (bursting) {
      progress = burstProgress;
      reveal = burstElement;
    }
    const motion = bursting ? 1 : mix(1, 0.38, smoothstep(230, 1080, timestamp - lastInput));
    const disturbance = envelope(progress, 0, 0.17, 0.23, 0.42) * motion;
    const swarm = envelope(progress, 0.09, 0.35, 0.52, 0.81) * motion;
    const disintegrate = envelope(progress, 0.36, 0.56, 0.68, 0.87) * motion;
    const reconstruct = envelope(progress, 0.58, 0.76, 0.86, 1) * motion;
    const heroBottom = Math.max(height * 0.65, sections[0]?.bottom || height);
    const hero = 1 - smoothstep(heroBottom * 0.28, heroBottom * 0.96, scroll);
    const ambience = Math.max(hero, contact * 0.46);
    const phase = progress < 0.06 ? 'calm' : progress < 0.25 ? 'disturbance'
      : progress < 0.48 ? 'swarm' : progress < 0.71 ? 'disintegration' : 'reconstruction';
    if (canvas.dataset.batPhase !== phase) canvas.dataset.batPhase = phase;

    if (painted) context.clearRect(0, 0, width, height);
    painted = Math.max(ambience, disturbance, swarm, disintegrate, reconstruct) > 0.008;
    if (!painted) {
      clearReveal();
      return;
    }

    const count = mobile ? mobileCount : flock.length;
    const scale = Math.min(width, height) / 700;
    for (let index = 0; index < count; index += 1) {
      const bat = flock[index];
      const lane = bat.lane / 2;
      const depth = bat.depth;
      const flight = wrap(bat.lead + time * (0.051 + depth * 0.025) + lane * 0.14);
      const drift = 1.12 - flight * 0.79;
      const gather = smoothstep(0.04, 0.41, progress);
      const sweep = mix(1.10, -0.23, progress) + (bat.lead - 0.5) * (0.28 - gather * 0.13);
      const turn = time * (0.56 + bat.stride * 0.13) + bat.phase;
      const bend = 0.07 * Math.sin(flight * 2.1 + lane * 2.8);
      const altitude = 0.29 + lane * 0.24 - flight * 0.19 + bat.height + bend;
      const rise = 0.52 + lane * 0.15 - progress * 0.29 + bat.height;
      const join = Math.max(swarm, disturbance * 0.25, reconstruct * 0.48);
      const x = mix(drift, sweep, join) * width;
      const y = (mix(altitude, rise, join) + Math.sin(turn) * 0.022
        + (pointer * 0.016 - wind * 0.018) * depth) * height;
      const edge = smoothstep(0.32, 0.49, x / width) * (1 - smoothstep(0.99, 1.09, x / width));
      const shadow = envelope(flight, 0, 0.13, 0.83, 1) * ambience * edge;
      const opacity = Math.min(0.98, (shadow * 0.78 + join * 0.88) * (0.47 + depth * 0.53));
      const radius = Math.max(2.3, (3.2 + depth * (mobile ? 15 : 31)) * scale * (1 + swarm * 0.23));
      if (opacity < 0.014 || x < -radius || x > width + radius) continue;

      const beat = Math.sin(time * (19.5 + bat.stride * 11) + bat.phase);
      const bank = Math.sin(turn) * 0.25;
      const angle = 0.13 + bat.skew + Math.sin(turn) * 0.15 + wind * 0.12 * depth;
      if (!mobile && swarm > 0.22 && depth > 0.55) {
        silhouette(context, x + 6 + depth * 8, y + 2, radius, angle, beat - 0.20, bank, opacity * 0.16, 0);
      }
      silhouette(context, x, y, radius, angle, beat, bank, opacity, bat.ember ? 0.78 : 0.20);
    }

    if (reveal !== activeReveal) clearReveal();
    const rect = reveal?.getBoundingClientRect();
    const rectVisible = rect && rect.width && rect.height && rect.bottom > 0 && rect.top < height;
    const visual = rectVisible ? rect : {
      left: width * (mobile ? 0.35 : 0.53),
      top: height * 0.29,
      width: width * (mobile ? 0.56 : 0.39),
      height: height * 0.40,
    };
    drawFragments(context, visual, time, disintegrate, reconstruct, mobile);

    if (rectVisible && (disintegrate > 0.01 || reconstruct > 0.01)) {
      activeReveal = reveal;
      reveal.style.setProperty('--bat-disintegration', disintegrate.toFixed(3));
      reveal.style.setProperty('--bat-reconstruction', reconstruct.toFixed(3));
    } else {
      clearReveal();
    }
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    canvas.dataset.batMode = reduce.matches ? 'static' : 'animated';
    if (reduce.matches || document.hidden) {
      context.clearRect(0, 0, width, height);
      canvas.dataset.batPhase = 'calm';
      clearReveal();
      return;
    }
    scroll = window.scrollY;
    lastScroll = scroll;
    frame = requestAnimationFrame(draw);
  }

  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  observer?.observe(document.body);
  window.addEventListener('resize', resize, options);
  window.addEventListener('load', resize, options);
  window.addEventListener('scroll', () => {
    scroll = window.scrollY;
    lastInput = performance.now();
  }, options);
  window.addEventListener('pointermove', (event) => {
    if (!mobile && event.pointerType === 'mouse') targetPointer = event.clientY / height - 0.5;
  }, options);
  document.documentElement.addEventListener('pointerleave', () => {
    targetPointer = 0;
  }, options);
  document.addEventListener('visibilitychange', sync, options);
  reduce.addEventListener('change', sync, options);
  touch.addEventListener('change', resize, options);
  sync();

  return {
    burst(target) {
      if (reduce.matches) return;
      burstAt = performance.now();
      burstElement = target instanceof Element ? target : null;
    },
    destroy() {
      cancelAnimationFrame(frame);
      events.abort();
      observer?.disconnect();
      clearReveal();
      context.clearRect(0, 0, width, height);
      canvas.dataset.batMode = 'static';
      canvas.dataset.batPhase = 'calm';
    },
  };
}

