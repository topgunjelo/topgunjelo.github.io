/**
 * Formations for the particle orb. Every generator returns exactly `n` points as a flat
 * Float32Array of x, y, z in local unit space (-1…1, y pointing down like the screen).
 * Points are ordered top to bottom, so particle i lands in roughly the same region of every
 * formation and morphs travel short, coherent paths instead of criss-crossing.
 */

export type Points3 = Float32Array;

/** Even dot-matrix sphere (Fibonacci lattice), ordered from top to bottom. */
export function sphere(n: number): Points3 {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = -1 + (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const a = i * golden;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}

/** Dot-matrix cube surface: a grid on each of the six faces. */
export function cube(n: number): Points3 {
  const perFace = Math.max(4, Math.round(Math.sqrt(n / 6)));
  const pts: number[][] = [];
  const s = 0.62;
  for (let face = 0; face < 6; face++) {
    for (let a = 0; a < perFace; a++) {
      for (let b = 0; b < perFace; b++) {
        const u = (a / (perFace - 1)) * 2 - 1;
        const v = (b / (perFace - 1)) * 2 - 1;
        const axis = face >> 1;
        const sign = face & 1 ? 1 : -1;
        const p = [0, 0, 0];
        p[axis] = sign;
        p[(axis + 1) % 3] = u;
        p[(axis + 2) % 3] = v;
        pts.push([p[0] * s, p[1] * s, p[2] * s]);
      }
    }
  }
  pts.sort((p, q) => p[1] - q[1]);
  return fit(pts, n, 0.004);
}

type Draw = (ctx: CanvasRenderingContext2D) => void;

/**
 * Rasterizes a 24×24 icon-space drawing and samples it on a grid, giving a dot-matrix
 * version of the shape. `layers` stacks copies in depth so the shape reads as 3D when it turns.
 */
export function fromDrawing(n: number, draw: Draw, { layers = 2, depth = 0.12, scale = 1 } = {}): Points3 {
  const size = 240;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.lineCap = ctx.lineJoin = 'round';
  draw(ctx);
  const data = ctx.getImageData(0, 0, size, size).data;

  let filled = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) filled++;
  const step = Math.max(1, Math.sqrt(filled / (n / layers)));

  const pts: number[][] = [];
  for (let y = step / 2; y < size; y += step) {
    for (let x = step / 2; x < size; x += step) {
      if (data[((y | 0) * size + (x | 0)) * 4 + 3] <= 128) continue;
      const lx = ((x / size) * 2 - 1) * scale;
      const ly = ((y / size) * 2 - 1) * scale;
      for (let l = 0; l < layers; l++) {
        const z = layers === 1 ? 0 : (l / (layers - 1) - 0.5) * depth;
        pts.push([lx, ly, z]);
      }
    }
  }
  return fit(pts, n, 0.006);
}

/** Lucide "phone" (ISC), filled and stroked into a solid handset. */
const PHONE =
  'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384';

export function phone(n: number): Points3 {
  return fromDrawing(
    n,
    ctx => {
      const path = new Path2D(PHONE);
      ctx.lineWidth = 2.4;
      ctx.fill(path);
      ctx.stroke(path);
    },
    { layers: 3, depth: 0.26, scale: 0.92 },
  );
}

/** Frontend: a browser window — frame, title bar with three lights, content rows. */
export function windowShape(n: number): Points3 {
  return fromDrawing(n, ctx => {
    ctx.lineWidth = 1.3;
    roundRect(ctx, 2, 4.5, 20, 15, 2.4);
    ctx.stroke();
    ctx.fillRect(2, 8, 20, 1.1);
    for (const x of [4.4, 6.4, 8.4]) {
      ctx.beginPath();
      ctx.arc(x, 6.3, 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 1.2;
    for (const [x1, x2, y] of [[5, 15, 11.5], [5, 19, 14], [5, 12, 16.5]]) {
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
  });
}

/** Cybersecurity: a shield with a check. */
export function shield(n: number): Points3 {
  return fromDrawing(
    n,
    ctx => {
      ctx.beginPath();
      ctx.moveTo(12, 2);
      ctx.lineTo(20, 5);
      ctx.lineTo(20, 11);
      ctx.bezierCurveTo(20, 16, 16.5, 20, 12, 22);
      ctx.bezierCurveTo(7.5, 20, 4, 16, 4, 11);
      ctx.lineTo(4, 5);
      ctx.closePath();
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8.5, 12);
      ctx.lineTo(11, 14.5);
      ctx.lineTo(15.8, 9.5);
      ctx.stroke();
    },
    { layers: 2, depth: 0.14 },
  );
}

/** Multimedia: a play button — ring plus triangle. */
export function play(n: number): Points3 {
  return fromDrawing(n, ctx => {
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(12, 12, 9.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9.6, 7.6);
    ctx.lineTo(16.8, 12);
    ctx.lineTo(9.6, 16.4);
    ctx.closePath();
    ctx.fill();
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Resamples any point list to exactly n points, keeping its order. */
export function fit(pts: number[][], n: number, jitter: number): Points3 {
  const out = new Float32Array(n * 3);
  if (!pts.length) return out;
  for (let i = 0; i < n; i++) {
    const p = pts[Math.floor((i * pts.length) / n)];
    // Duplicates (when the shape has fewer samples than particles) get a hair of jitter.
    const j = pts.length < n ? jitter : 0;
    out[i * 3] = p[0] + (Math.random() - 0.5) * j;
    out[i * 3 + 1] = p[1] + (Math.random() - 0.5) * j;
    out[i * 3 + 2] = p[2];
  }
  return out;
}

/** Points are in px relative to the container's box at sampling time (`width` × `height`). */
export type TextTargets = { points: Float32Array; words: Uint16Array; wordCount: number; width: number; height: number };

/**
 * Samples the glyphs of a block of words, in place, as dot positions relative to the
 * container. Words are drawn from their own boxes, so line breaks match the real layout.
 */
export function sampleText(container: HTMLElement, wordSelector: string, n: number, step: number): TextTargets | null {
  const words = [...container.querySelectorAll<HTMLElement>(wordSelector)];
  const box = container.getBoundingClientRect();
  if (!words.length || box.width < 10) return null;
  const w = Math.ceil(box.width);
  const h = Math.ceil(box.height);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const style = getComputedStyle(words[0]);
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = style.letterSpacing;
  ctx.fillStyle = '#000';

  const rects = words.map(word => {
    const r = word.getBoundingClientRect();
    const text = word.textContent ?? '';
    const m = ctx.measureText(text);
    const asc = m.fontBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent;
    const x = r.left - box.left;
    const y = r.top - box.top;
    ctx.fillText(text, x, y + (r.height - (asc + desc)) / 2 + asc);
    return { x, y, r: x + r.width, b: y + r.height };
  });

  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: number[][] = [];
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      if (data[((y | 0) * w + (x | 0)) * 4 + 3] < 140) continue;
      let word = 0;
      for (let k = 0; k < rects.length; k++) {
        const q = rects[k];
        if (x >= q.x && x <= q.r && y >= q.y && y <= q.b) {
          word = k;
          break;
        }
      }
      pts.push([x, y, word]);
    }
  }
  if (!pts.length) return null;

  const points = new Float32Array(n * 2);
  const wordIds = new Uint16Array(n);
  for (let i = 0; i < n; i++) {
    const p = pts[Math.floor((i * pts.length) / n)];
    const j = pts.length < n ? step * 0.4 : 0;
    points[i * 2] = p[0] + (Math.random() - 0.5) * j;
    points[i * 2 + 1] = p[1] + (Math.random() - 0.5) * j;
    wordIds[i] = p[2];
  }
  return { points, words: wordIds, wordCount: words.length, width: box.width, height: box.height };
}
