const sectionSelector = '[data-bat-section]';
const desktopCount = 34;
const mobileCount = 17;
const tau = 2 * Math.PI;
const chapterInk = ['#260b14', '#330e19', '#42121f', '#521622', '#611b2a'];

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

function silhouette(context, x, y, radius, angle, beat, bank, opacity, rim, ink = '#080507', edgeInk = '#9e3947') {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.scale(radius, radius);
  context.globalAlpha = opacity;
  context.fillStyle = ink;
  context.beginPath();
  wing(context, -1, clamp(beat - bank, -1, 1));
  wing(context, 1, clamp(beat + bank, -1, 1));
  context.fill();
  if (rim > 0) {
    context.globalAlpha = opacity * rim;
    context.strokeStyle = edgeInk;
    context.lineWidth = Math.min(0.16, 0.93 / radius);
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

function openingMembers(count, seed) {
  const next = randomSource(seed);
  return Array.from({ length: count }, (_, index) => ({
    slot: (index * 43) % count,
    side: index % 2 ? -1 : 1,
    order: next(),
    depth: next() ** 2.1,
    offset: next() - 0.5,
    phase: next() * tau,
    rhythm: next(),
    rim: index % 6 === 1 ? 0.53 : 0.21,
  })).sort((a, b) => a.depth - b.depth);
}

const wideOpening = openingMembers(116, 512621);
const compactOpening = openingMembers(64, 512621);

function sampleTitle(title, canvas, width, height) {
  if (!title) return [];
  const ratio = Math.min(1, 760 / width, 760 / height);
  const mask = document.createElement('canvas');
  mask.width = Math.ceil(width * ratio);
  mask.height = Math.ceil(height * ratio);
  const brush = mask.getContext('2d', { willReadFrequently: true });
  if (!brush) return [];
  brush.scale(ratio, ratio);
  brush.fillStyle = '#fff';
  brush.textAlign = 'center';
  const range = document.createRange();
  const field = canvas.getBoundingClientRect();
  const words = title.children.length ? title.children : [title];
  for (const word of words) {
    range.selectNodeContents(word);
    const bounds = range.getBoundingClientRect();
    const style = getComputedStyle(word);
    const text = word.textContent.trim();
    if (!bounds.width || !text) continue;
    brush.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    if ('letterSpacing' in brush) brush.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    const metrics = brush.measureText(text);
    const rise = metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent;
    brush.fillText(text, bounds.left - field.left + bounds.width * 0.5,
      bounds.top - field.top + (bounds.height + rise) * 0.5, bounds.width);
  }

  const points = [];
  const pixels = brush.getImageData(0, 0, mask.width, mask.height).data;
  const stride = Math.max(3, Math.round(Math.min(mask.width, mask.height) / 95));
  for (let x = stride; x < mask.width; x += stride) {
    for (let y = stride; y < mask.height; y += stride) {
      if (pixels[(y * mask.width + x) * 4 + 3] > 178) points.push([x / ratio, y / ratio]);
    }
  }
  return points;
}

export function createOpeningFlock(canvas, title) {
  const still = () => {};
  if (!canvas) return still;
  canvas.dataset.flockMode = 'static';
  let context;
  try {
    context = canvas.getContext('2d', { alpha: true });
  } catch {
    return still;
  }
  if (!context) return still;
  canvas.dataset.flockMode = 'animated';

  let width = 0;
  let height = 0;
  let ratio = 0;
  let glyphs = [];
  let fonts;
  let sampled = false;
  return function paint(progress, time) {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;
    const mobile = nextWidth < 760;
    const nextRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.55);
    const nextFonts = document.fonts?.status;
    if (width !== nextWidth || height !== nextHeight || ratio !== nextRatio) {
      width = nextWidth;
      height = nextHeight;
      ratio = nextRatio;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      sampled = false;
    }
    context.clearRect(0, 0, width, height);
    const phase = progress < 0.08 ? 'stillness' : progress < 0.34 ? 'sweep'
      : progress < 0.74 ? 'assemble' : progress === 0.74 ? 'formed'
      : progress < 1 ? 'disperse' : 'complete';
    if (canvas.dataset.flockPhase !== phase) canvas.dataset.flockPhase = phase;
    if (progress <= 0 || progress >= 1) return;
    if (fonts !== nextFonts || !sampled) {
      fonts = nextFonts;
      sampled = true;
      try {
        glyphs = sampleTitle(title, canvas, width, height);
      } catch {
        glyphs = [];
      }
    }

    const members = mobile ? compactOpening : wideOpening;
    const radiusScale = clamp(Math.min(width, height) / 650, 0.64, 1.42);
    for (const bat of members) {
      const { slot, side, order, depth, offset } = bat;
      const sample = glyphs[Math.floor((slot + 0.12 + order * 0.76) * glyphs.length / members.length)];
      const destinationX = sample ? sample[0] / width : 0.12 + slot / members.length * 0.76;
      const destinationY = sample ? sample[1] / height : 0.45 + offset * 0.14;
      const upper = slot % 4 < 2 ? -1 : 1;
      const delay = 0.025 + destinationX * 0.12 + order * 0.10;
      const arrival = smoothstep(delay, 0.47 + destinationX * 0.21 + order * 0.04, progress);
      const departure = smoothstep(0.74 + order * 0.056, 0.99, progress);
      const arch = Math.sin(arrival * Math.PI);
      const flight = Math.max(1 - arrival, departure);
      const wave = Math.sin(time * 3.4 + bat.phase);
      const flutter = Math.sin(time * (23 + 10 * bat.rhythm) + bat.phase) * (0.33 + 0.67 * flight);
      const entryX = 0.50 + side * (0.49 + order * 0.17 - depth * 0.15);
      const entryY = 0.45 + upper * (0.30 + 0.25 * offset);
      const x = mix(entryX, destinationX, arrival) + arch * side * (0.08 + depth * 0.07)
        + departure * (destinationX < 0.50 ? -1 : 1) * (0.30 + order * 0.64);
      const y = mix(entryY, destinationY, arrival) + arch * upper * (0.065 + order * 0.045)
        + departure * upper * (0.24 + bat.rhythm * 0.49) + wave * flight * 0.014;
      const radius = mix(3.8 + depth * 35, 3.8 + depth * 8, arrival)
        * radiusScale * (1 + 2.3 * departure);
      const opacity = smoothstep(delay * 0.5, delay + 0.10, progress)
        * (0.66 + depth * 0.33) * (1 - smoothstep(0.90, 1, progress))
        * mix(1, 0.62, smoothstep(0.59, 0.74, progress) * (1 - departure));
      const px = x * width;
      const py = y * height;
      if (opacity < 0.017 || px < -radius || px > width + radius
        || py < -radius || py > height + radius) continue;

      const rim = bat.rim * (0.68 + 0.27 * wave);
      const bank = (wave * 0.30 + offset * 0.18) * flight;
      const rotation = (side * 0.31 + wave * 0.19) * flight + offset * 0.22;
      const ink = depth < 0.32 ? '#11070b' : '#050405';
      if (!mobile && depth > 0.89 && departure > 0.20 && departure < 0.90) {
        silhouette(context, px - side * radius * 0.32, py - upper * radius * 0.20,
          radius * 0.97, rotation, flutter * 0.86, bank, opacity * 0.19, 0, ink);
      }
      silhouette(context, px, py, radius, rotation, flutter, bank, opacity, rim, ink);
    }
  };
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
      const distance = Math.abs(position - 0.52);
      if (position > 0.11 && position < 1.04 && distance < nearest) {
        progress = (1.04 - position) / 0.93;
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
    const motion = bursting ? 1 : mix(1, 0.43, smoothstep(230, 1080, timestamp - lastInput));
    const disturbance = envelope(progress, 0, 0.17, 0.23, 0.42) * motion;
    const swarm = envelope(progress, 0.09, 0.35, 0.52, 0.81) * motion;
    const disintegrate = envelope(progress, 0.36, 0.56, 0.68, 0.87) * motion;
    const reconstruct = envelope(progress, 0.58, 0.76, 0.86, 1) * motion;
    const heroBottom = Math.max(height * 0.65, sections[0]?.bottom || height);
    const hero = 1 - smoothstep(heroBottom * 0.28, heroBottom * 0.96, scroll);
    const ambience = Math.max(0.46, hero, contact * 0.68);
    const phase = progress < 0.06 ? 'calm' : progress < 0.25 ? 'disturbance'
      : progress < 0.48 ? 'swarm' : progress < 0.71 ? 'disintegration' : 'reconstruction';
    if (canvas.dataset.batPhase !== phase) canvas.dataset.batPhase = phase;

    context.clearRect(0, 0, width, height);

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
      const opacity = Math.min(0.98, (shadow * 0.93 + join * 0.86) * (0.56 + depth * 0.44));
      const radius = Math.max(2.5, (4.3 + depth * (mobile ? 17 : 34)) * scale * (1 + swarm * 0.24));
      if (opacity < 0.014 || x < -radius || x > width + radius) continue;

      const beat = Math.sin(time * (19.5 + bat.stride * 11) + bat.phase);
      const bank = Math.sin(turn) * 0.25;
      const angle = 0.13 + bat.skew + Math.sin(turn) * 0.15 + wind * 0.12 * depth;
      const inkIndex = Math.min(chapterInk.length - 1, Math.floor(depth * 3 + join * 3 + (bat.ember ? 1 : 0)));
      const ink = chapterInk[inkIndex];
      if (!mobile && swarm > 0.22 && depth > 0.55) {
        silhouette(context, x + 6 + depth * 8, y + 2, radius, angle, beat - 0.20, bank, opacity * 0.16, 0, ink);
      }
      silhouette(context, x, y, radius, angle, beat, bank, opacity,
        bat.ember ? 0.83 : 0.43, ink, bat.ember ? '#c96072' : '#ae4658');
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

