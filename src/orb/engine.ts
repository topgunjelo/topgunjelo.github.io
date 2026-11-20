import * as THREE from 'three';
import { cube, phone, play, sampleText, shield, sphere, windowShape, type TextTargets } from './shapes';
import { orbStore, type IntroStage } from './store';

/**
 * The orb: one persistent set of particles that travels through the page.
 *
 * Every particle keeps its identity and has a target in each "station":
 *   hero      → a rotating dot-matrix sphere
 *   text      → a dot on the glyphs of the About statement
 *   companion → a sphere that morphs into a symbol for the focused interest
 *   contact   → a 3D telephone
 * Scroll progress blends between stations (staggered per particle, so the orb dissolves and
 * re-forms instead of sliding), and a spring layer on top lets the cursor scatter particles
 * that always find their way home. Positions live in CSS pixels; a point shader draws them.
 */

type RGB = [number, number, number];
const INK: RGB = [0.114, 0.114, 0.122];
const BLUE: RGB = [0.18, 0.47, 0.98];
const CYAN: RGB = [0.13, 0.74, 0.93];
const LAVENDER: RGB = [0.62, 0.5, 0.98];
/** Tones for the four interests: blue, cyan, lavender, silver. */
const TONES: RGB[] = [
  [0.16, 0.45, 0.98],
  [0.08, 0.66, 0.86],
  [0.52, 0.38, 0.94],
  [0.4, 0.46, 0.62],
];

const VERTEX = /* glsl */ `
  attribute vec4 aColor;
  uniform vec2 uView;
  uniform float uDpr;
  varying vec4 vColor;
  varying float vSize;
  void main() {
    vColor = aColor;
    vSize = position.z * uDpr;
    gl_Position = vec4(position.x / uView.x * 2.0 - 1.0, 1.0 - position.y / uView.y * 2.0, 0.0, 1.0);
    gl_PointSize = max(vSize, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec4 vColor;
  varying float vSize;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float alpha = smoothstep(0.5, 0.34, d) * vColor.a;
    if (alpha < 0.01) discard;
    // Larger dots get a soft specular cap, so they read as tiny orbs rather than flat discs.
    float cap = smoothstep(0.3, 0.0, length(c - vec2(-0.13, -0.15))) * smoothstep(3.0, 6.0, vSize);
    gl_FragColor = vec4(mix(vColor.rgb, vec3(1.0), cap * 0.45), alpha);
  }
`;

type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number; r: number };

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export class OrbEngine {
  private readonly n: number;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.ShaderMaterial;
  private readonly pos: Float32Array; // x, y, size
  private readonly col: Float32Array; // r, g, b, a
  private readonly posAttr: THREE.BufferAttribute;
  private readonly colAttr: THREE.BufferAttribute;

  // Physics layer: displacement from the formation and its velocity.
  private readonly disp: Float32Array;
  private readonly vel: Float32Array;
  // Per-particle constants: arc direction/amount, stagger jitter, morph rate, wobble phase.
  private readonly seed: Float32Array;
  private readonly grad: Float32Array;

  private readonly sphereP: Float32Array;
  private readonly phoneP: Float32Array;
  private readonly companionShapes: Float32Array[];
  private readonly comp: Float32Array; // smoothed companion positions (rotated, local)
  private text: TextTargets | null = null;
  private textStamp = '';

  private readonly pointer = { x: -9999, y: -9999, speed: 0, nx: 0, ny: 0, inside: false };
  private parallax = { x: 0, y: 0 };
  private tone: RGB = [...BLUE];
  private toneMix = 0;
  private time = 0;
  private last = performance.now();
  private assembleSeen = orbStore.assembleRequest;
  private blank = false;
  private disposed = false;
  private resizeTimer = 0;

  // Intro: particles follow their own smoothed positions and style while a scene plays.
  private readonly introPos: Float32Array; // x, y
  private readonly introSty: Float32Array; // r, g, b, a, size
  private introStage: IntroStage = null;
  private introT = 0;
  private nameText: TextTargets | null = null;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const small = innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4;
    this.n = small ? 2600 : 5200;
    const n = this.n;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { uView: { value: new THREE.Vector2(1, 1) }, uDpr: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 4);
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.colAttr = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('aColor', this.colAttr);
    const points = new THREE.Points(this.geometry, this.material);
    points.frustumCulled = false;
    this.scene.add(points);

    this.disp = new Float32Array(n * 2);
    this.vel = new Float32Array(n * 2);
    this.seed = new Float32Array(n * 4);
    this.grad = new Float32Array(n * 3);
    this.sphereP = sphere(n);
    this.phoneP = phone(n);
    this.companionShapes = [this.sphereP, windowShape(n), cube(n), shield(n), play(n)];
    this.comp = new Float32Array(this.sphereP);
    this.introPos = new Float32Array(n * 2);
    this.introSty = new Float32Array(n * 5);

    for (let i = 0; i < n; i++) {
      this.seed[i * 4] = (Math.random() - 0.5) * 2; // arc direction and amount
      this.seed[i * 4 + 1] = Math.random(); // stagger jitter
      this.seed[i * 4 + 2] = 3 + Math.random() * 4; // morph rate
      this.seed[i * 4 + 3] = Math.random() * Math.PI * 2; // wobble phase
      // Gradient across the sphere: blue core, cyan toward the right, lavender toward the bottom.
      const x = this.sphereP[i * 3];
      const y = this.sphereP[i * 3 + 1];
      const tc = ease(clamp01((x + 0.6) / 1.6));
      const tl = ease(clamp01((y + 0.4) / 1.4));
      for (let k = 0; k < 3; k++) {
        const base = BLUE[k] + (CYAN[k] - BLUE[k]) * tc;
        this.grad[i * 3 + k] = base + (LAVENDER[k] - base) * tl * 0.85;
      }
    }

    this.resize();
    addEventListener('resize', this.onResize);
    addEventListener('pointermove', this.onPointer, { passive: true });
    addEventListener('pointerdown', this.onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onLeave);
    document.fonts?.ready.then(() => this.refreshText());
    this.renderer.setAnimationLoop(this.frame);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    removeEventListener('resize', this.onResize);
    removeEventListener('pointermove', this.onPointer);
    removeEventListener('pointerdown', this.onPointer);
    document.documentElement.removeEventListener('pointerleave', this.onLeave);
    clearTimeout(this.resizeTimer);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    document.documentElement.style.removeProperty('--orb-hero');
  }

  // ---------- Input ----------

  private onPointer = (event: PointerEvent) => {
    const p = this.pointer;
    if (p.inside && event.type === 'pointermove') {
      const dist = Math.hypot(event.clientX - p.x, event.clientY - p.y);
      p.speed = Math.min(2400, p.speed * 0.6 + (dist / Math.max(event.timeStamp - this.lastPointerTime, 8)) * 1000 * 0.4);
    }
    this.lastPointerTime = event.timeStamp;
    p.x = event.clientX;
    p.y = event.clientY;
    p.nx = (event.clientX / innerWidth) * 2 - 1;
    p.ny = (event.clientY / innerHeight) * 2 - 1;
    p.inside = true;
  };
  private lastPointerTime = 0;

  private onLeave = () => {
    this.pointer.inside = false;
    this.pointer.x = this.pointer.y = -9999;
  };

  private onResize = () => {
    this.resize();
    clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.refreshText(), 180);
  };

  private resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.material.uniforms.uView.value.set(innerWidth, innerHeight);
    this.material.uniforms.uDpr.value = dpr;
  }

  private refreshText() {
    if (this.disposed) return;
    const el = document.querySelector<HTMLElement>('[data-orb="text"]');
    if (!el) return;
    const box = el.getBoundingClientRect();
    const stamp = `${Math.round(box.width)}x${Math.round(box.height)}`;
    if (stamp === this.textStamp && this.text) return;
    const step = innerWidth < 760 ? 3 : 4;
    this.text = sampleText(el, '.lit-word', this.n, step);
    this.textStamp = stamp;
  }

  // ---------- Frame ----------

  private box(name: string): Box | null {
    const el = document.querySelector<HTMLElement>(`[data-orb="${name}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: r.width / 2 };
  }

  private frame = () => {
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 1 / 30);
    this.last = now;
    this.time += dt;
    const t = this.time;
    const vw = innerWidth;
    const vh = innerHeight;

    const hero = this.box('hero');
    const textBox = this.box('text');
    const zone = this.box('zone');
    const companion = this.box('companion');
    const contact = this.box('contact');
    if (textBox && !this.text) this.refreshText();
    const text = textBox ? this.text : null;

    // Scroll progress for each leg of the journey.
    const pText = textBox ? clamp01((0.85 * vh - textBox.y) / (0.35 * vh + textBox.h)) : 0;
    const w12 = zone ? clamp01((0.95 * vh - zone.y) / (0.5 * vh)) : 0;
    const w23 = contact ? clamp01((1.05 * vh - contact.y) / (0.7 * vh)) : 0;
    document.documentElement.style.setProperty('--orb-hero', (1 - clamp01(pText * 2.5)).toFixed(3));

    // Hero sphere rotation, with a little parallax from the pointer.
    const p = this.pointer;
    const pl = 1 - Math.exp(-dt * 3);
    this.parallax.x += ((p.inside ? p.nx : 0) - this.parallax.x) * pl;
    this.parallax.y += ((p.inside ? p.ny : 0) - this.parallax.y) * pl;
    const heroRot = rotation(t * 0.16 + this.parallax.x * 0.45, -0.28 + this.parallax.y * 0.25);
    const phoneRot = rotation(Math.sin(t * 0.7) * 0.55, 0.16 + Math.sin(t * 0.5) * 0.08);

    // Companion: morph toward the focused interest's shape and tone.
    const focus = orbStore.focus;
    const shapeIndex = focus === null ? 0 : focus + 1;
    const flat = shapeIndex === 1 || shapeIndex === 3 || shapeIndex === 4;
    const compRot = flat
      ? rotation(Math.sin(t * 0.8) * 0.35, Math.sin(t * 0.6) * 0.12)
      : shapeIndex === 2
        ? rotation(t * 0.35, -0.5)
        : rotation(t * 0.2, -0.25);
    const toneTarget = focus === null ? BLUE : TONES[focus];
    const tl = 1 - Math.exp(-dt * 4);
    for (let k = 0; k < 3; k++) this.tone[k] += (toneTarget[k] - this.tone[k]) * tl;
    this.toneMix += ((focus === null ? 0 : 1) - this.toneMix) * tl;

    // A new intro handoff: start the hero sphere collapsed at its center, then let it spring open.
    if (this.assembleSeen !== orbStore.assembleRequest) {
      this.assembleSeen = orbStore.assembleRequest;
      if (hero) this.collapseTo(hero, heroRot);
    }

    // Fewer particles on small screens, so dots stay a touch larger there to keep the form legible.
    const heroScale = hero ? clamp(hero.r / 240, 0.9, 1.15) : 1;
    const compScale = companion ? clamp(companion.r / 200, 0.9, 1.1) : 1;
    const contactScale = contact ? clamp(contact.r / 100, 0.85, 1.1) : 1;
    // Leaving for Contact, the companion is treated as just above the viewport, so particles
    // stream in from the top edge instead of from a point thousands of pixels away.
    const compCy = companion ? (w23 > 0 ? Math.max(companion.cy, -0.3 * vh) : companion.cy) : 0;

    const cursorR = 72 + Math.min(p.speed, 1600) * 0.06;
    const push = 4200 * (0.55 + Math.min(p.speed / 900, 1.4));
    p.speed *= Math.exp(-dt * 5);

    const shape = this.companionShapes[shapeIndex];
    const morphMoving = w12 > 0 && w23 < 1;
    let visible = 0;
    const n = this.n;

    // ---------- Intro scenes ----------
    const stage = orbStore.introStage;
    const endingIntro = !stage && this.introStage !== null;
    if (stage !== this.introStage) {
      if (stage && !this.introStage) this.scatterForIntro(vw, vh);
      if (stage === 'name') this.sampleName();
      this.introStage = stage;
      this.introT = 0;
    }
    this.introT += dt;
    // While the intro plays, the particles draw above its white stage.
    this.canvas.style.zIndex = stage ? '101' : '';
    const introOrb = stage === 'gather' ? this.box('intro-orb') : null;
    // The name's box is read live, transform included, so dots can ride along as it glides.
    const nameBox = stage === 'name' || stage === 'hero' ? this.box('intro-name') : null;
    const introRot = rotation(t * 0.5, -0.3);
    const nameText = this.nameText;
    const nameScale = nameBox && nameText ? nameBox.w / nameText.width : 1;

    for (let i = 0; i < n; i++) {
      const s4 = i * 4;
      const jitter = this.seed[s4 + 1];
      const arc = this.seed[s4];

      // Staggered per-particle progress for each leg.
      const word = text ? text.words[i] / Math.max(text.wordCount, 1) : 0;
      const e01 = text ? ease(clamp01((pText - (word * 0.84 + jitter * 0.06)) / 0.14)) : 0;
      const e12 = ease(clamp01((w12 - jitter * 0.45) / 0.55));
      const e23 = ease(clamp01((w23 - jitter * 0.45) / 0.55));

      let x = 0;
      let y = 0;
      let size = 2;
      let a = 1;
      let r = INK[0];
      let g = INK[1];
      let b = INK[2];

      // Station 0: hero sphere.
      if (hero && e01 < 1 && e12 < 1 && e23 < 1) {
        const q = rotate(this.sphereP, i, heroRot);
        const f = (q[2] + 1) / 2; // 1 = facing us
        const wob = Math.sin(t * 1.3 + this.seed[s4 + 3]) * 0.004;
        x = hero.cx + q[0] * hero.r * (1 + wob);
        y = hero.cy + q[1] * hero.r * (1 + wob);
        // The far side recedes hard (smaller, fainter) so the two hemispheres don't moiré.
        const ff = f * f;
        size = (1.1 + 2.3 * ff) * heroScale;
        a = 0.1 + 0.9 * ff;
        // Specular from the upper left gives the dot-matrix sphere a glossy, lit read.
        const spec = Math.pow(clamp01(-q[0] * 0.45 - q[1] * 0.55 + q[2] * 0.7), 5) * 0.55;
        r = this.grad[i * 3] + (1 - this.grad[i * 3]) * spec;
        g = this.grad[i * 3 + 1] + (1 - this.grad[i * 3 + 1]) * spec;
        b = this.grad[i * 3 + 2] + (1 - this.grad[i * 3 + 2]) * spec;
      }

      // Station 1: the About statement's glyphs, in ink.
      if (text && textBox && e01 > 0 && e12 < 1 && e23 < 1) {
        const tx = textBox.x + text.points[i * 2];
        const ty = textBox.y + text.points[i * 2 + 1];
        const tsize = innerWidth < 760 ? 1.5 : 1.9;
        // Once its word has filled in, a landed dot quiets down so the type stays crisp.
        const settled = 0.9 - 0.5 * clamp01((pText - (word * 0.84 + 0.2)) / 0.1);
        if (!hero || e01 >= 1) {
          x = tx;
          y = ty;
          size = tsize;
          a = settled;
          r = INK[0];
          g = INK[1];
          b = INK[2];
        } else {
          [x, y] = arcMix(x, y, tx, ty, e01, arc, 90);
          const inkT = clamp01(e01 / 0.35); // turns black early: a stream of small black orbs
          r += (INK[0] - r) * inkT;
          g += (INK[1] - g) * inkT;
          b += (INK[2] - b) * inkT;
          size = (size + (tsize - size) * e01) * (1 - 0.3 * Math.sin(Math.PI * e01));
          a = a + (0.92 - a) * e01;
        }
      }

      // Station 2: the curiosity companion.
      if (companion && e12 > 0 && e23 < 1) {
        const target = rotate(shape, i, compRot);
        const c3 = i * 3;
        if (morphMoving) {
          const k = 1 - Math.exp(-dt * this.seed[s4 + 2]);
          this.comp[c3] += (target[0] - this.comp[c3]) * k;
          this.comp[c3 + 1] += (target[1] - this.comp[c3 + 1]) * k;
          this.comp[c3 + 2] += (target[2] - this.comp[c3 + 2]) * k;
        }
        const f = (this.comp[c3 + 2] + 1) / 2;
        // Depth shading suits the sphere; flat symbols would just go dim, so they stay bright.
        const ff = shapeIndex === 0 ? f * f : shapeIndex === 2 ? 0.25 + 0.75 * f : 0.72 + 0.28 * f;
        const cx = companion.cx + this.comp[c3] * companion.r;
        const cy = compCy + this.comp[c3 + 1] * companion.r;
        const csize = (1 + 2.1 * ff) * compScale;
        const ca = 0.12 + 0.88 * ff;
        const gr = this.grad[i * 3];
        const gg = this.grad[i * 3 + 1];
        const gb = this.grad[i * 3 + 2];
        const cr = gr + (this.tone[0] - gr) * this.toneMix;
        const cg = gg + (this.tone[1] - gg) * this.toneMix;
        const cb = gb + (this.tone[2] - gb) * this.toneMix;
        if (e12 >= 1) {
          x = cx;
          y = cy;
          size = csize;
          a = ca;
          r = cr;
          g = cg;
          b = cb;
        } else {
          [x, y] = arcMix(x, y, cx, cy, e12, arc, 110);
          const ct = clamp01((e12 - 0.4) / 0.6); // stays ink in flight, colors as it arrives
          r += (cr - r) * ct;
          g += (cg - g) * ct;
          b += (cb - b) * ct;
          size = (size + (csize - size) * e12) * (1 - 0.25 * Math.sin(Math.PI * e12));
          a = a + (ca - a) * e12;
        }
      }

      // Station 3: the telephone in Contact.
      if (contact && e23 > 0) {
        const q = rotate(this.phoneP, i, phoneRot);
        const f = (q[2] + 1) / 2;
        const px = contact.cx + q[0] * contact.r;
        const py = contact.cy + q[1] * contact.r;
        const psize = (1.5 + 1.6 * f) * contactScale;
        const pa = 0.45 + 0.55 * f;
        const pr = this.grad[i * 3];
        const pg = this.grad[i * 3 + 1];
        const pb = this.grad[i * 3 + 2];
        if (e23 >= 1 || !companion) {
          x = px;
          y = py;
          size = psize;
          a = pa * (companion ? 1 : e23);
          r = pr;
          g = pg;
          b = pb;
        } else {
          [x, y] = arcMix(x, y, px, py, e23, arc, 140);
          const ct = clamp01((e23 - 0.3) / 0.7);
          r += (pr - r) * ct;
          g += (pg - g) * ct;
          b += (pb - b) * ct;
          size = (size + (psize - size) * e23) * (1 - 0.3 * Math.sin(Math.PI * e23));
          a = a + (pa - a) * e23;
        }
      }

      // Intro: particles play their own scene, easing toward each scene's targets with a
      // per-particle delay and rate, so every change reads as a flow rather than a cut.
      if (stage) {
        const ip = i * 2;
        const is = i * 5;
        // 'hero' scene: the targets are simply the hero sphere computed above.
        let tx = x;
        let ty = y;
        let tr = r;
        let tg = g;
        let tb = b;
        let ta = a;
        let ts = size;
        let delay = jitter * 0.35;
        if (stage === 'gather') {
          if (introOrb) {
            const q = rotate(this.sphereP, i, introRot);
            const ff = ((q[2] + 1) / 2) ** 2;
            tx = introOrb.cx + q[0] * introOrb.r;
            ty = introOrb.cy + q[1] * introOrb.r;
            tr = this.grad[i * 3];
            tg = this.grad[i * 3 + 1];
            tb = this.grad[i * 3 + 2];
            ts = 0.8 + 1.4 * ff;
            // Only every third particle shows in the small orb, so it reads as a crisp
            // dot-matrix sphere; the rest travel unseen and appear as they reach the name.
            ta = i % 3 === 0 ? 0.15 + 0.75 * ff : 0;
          } else {
            tx = this.introPos[ip];
            ty = this.introPos[ip + 1];
          }
          delay = jitter * 0.25;
        } else if (stage === 'name') {
          if (nameBox && nameText) {
            const along = nameText.points[ip] / nameText.width;
            tx = nameBox.x + nameText.points[ip] * nameScale;
            ty = nameBox.y + nameText.points[ip + 1] * nameScale;
            // Left to right, matching the order the letters sharpen in the DOM.
            delay = along * 0.55 + jitter * 0.12;
            tr = INK[0];
            tg = INK[1];
            tb = INK[2];
            ts = clamp(nameBox.h / 64, 1.2, 2.3);
            // Once a letter is solid, its dots quiet down and leave the type crisp.
            ta = this.introT > delay + 1.1 ? 0.22 : 0.9;
          } else {
            tx = this.introPos[ip];
            ty = this.introPos[ip + 1];
            delay = 0;
          }
        }
        // Scene 3: each dot first rides along with its letter as the name glides, then peels off
        // toward the hero sphere, spread across the glide so the name sheds them gradually.
        let riding = false;
        if (stage === 'hero' && nameBox && nameText) {
          delay = 0.1 + jitter * 0.9;
          if (this.introT < delay) {
            riding = true;
            tx = nameBox.x + nameText.points[ip] * nameScale;
            ty = nameBox.y + nameText.points[ip + 1] * nameScale;
            tr = this.introSty[is];
            tg = this.introSty[is + 1];
            tb = this.introSty[is + 2];
            ta = 0.1; // faint while riding, so they never read as a second copy of the name
            ts = this.introSty[is + 4];
          }
        }
        // Scene 1 converges faster so the small orb settles into a crisp sphere before it pours.
        const rate = this.seed[s4 + 2] * (stage === 'gather' ? 1.9 : 1.1);
        const k = riding ? 1 - Math.exp(-dt * 45) : this.introT >= delay ? 1 - Math.exp(-dt * rate) : 0;
        this.introPos[ip] += (tx - this.introPos[ip]) * k;
        this.introPos[ip + 1] += (ty - this.introPos[ip + 1]) * k;
        this.introSty[is] += (tr - this.introSty[is]) * k;
        this.introSty[is + 1] += (tg - this.introSty[is + 1]) * k;
        this.introSty[is + 2] += (tb - this.introSty[is + 2]) * k;
        this.introSty[is + 3] += (ta - this.introSty[is + 3]) * k;
        this.introSty[is + 4] += (ts - this.introSty[is + 4]) * k;
        x = this.introPos[ip];
        y = this.introPos[ip + 1];
        r = this.introSty[is];
        g = this.introSty[is + 1];
        b = this.introSty[is + 2];
        a = this.introSty[is + 3];
        size = this.introSty[is + 4];
      } else if (endingIntro) {
        // Hand over without a jump: the gap to the page formation becomes spring displacement.
        this.disp[i * 2] += this.introPos[i * 2] - x;
        this.disp[i * 2 + 1] += this.introPos[i * 2 + 1] - y;
      }

      // Cursor physics: repel within a speed-dependent radius, spring home, damp.
      const d2 = i * 2;
      let dx = this.disp[d2];
      let dy = this.disp[d2 + 1];
      let vx = this.vel[d2];
      let vy = this.vel[d2 + 1];
      const ox = x + dx - p.x;
      const oy = y + dy - p.y;
      const dist2 = ox * ox + oy * oy;
      let ax = -42 * dx - 10 * vx;
      let ay = -42 * dy - 10 * vy;
      if (dist2 < cursorR * cursorR && dist2 > 0.01) {
        const dist = Math.sqrt(dist2);
        const fall = (1 - dist / cursorR) ** 2 * push;
        ax += (ox / dist) * fall;
        ay += (oy / dist) * fall;
      }
      vx += ax * dt;
      vy += ay * dt;
      dx += vx * dt;
      dy += vy * dt;
      const m = dx * dx + dy * dy;
      if (m > 160 * 160) {
        const s = 160 / Math.sqrt(m);
        dx *= s;
        dy *= s;
      }
      this.disp[d2] = dx;
      this.disp[d2 + 1] = dy;
      this.vel[d2] = vx;
      this.vel[d2 + 1] = vy;

      const fx = x + dx;
      const fy = y + dy;
      const p3 = i * 3;
      this.pos[p3] = fx;
      this.pos[p3 + 1] = fy;
      this.pos[p3 + 2] = size;
      this.col[s4] = r;
      this.col[s4 + 1] = g;
      this.col[s4 + 2] = b;
      this.col[s4 + 3] = a;
      if (fx > -20 && fx < vw + 20 && fy > -20 && fy < vh + 20 && a > 0.02) visible++;
    }

    // Nothing on screen: clear once, then stop drawing until particles come back.
    if (!visible) {
      if (!this.blank) {
        this.renderer.clear();
        this.blank = true;
      }
      return;
    }
    this.blank = false;
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  };

  /** Scene 1 starts from nothing: particles scattered across the screen, fully transparent. */
  private scatterForIntro(vw: number, vh: number) {
    for (let i = 0; i < this.n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * Math.hypot(vw, vh) * 0.6;
      this.introPos[i * 2] = vw / 2 + Math.cos(a) * d;
      this.introPos[i * 2 + 1] = vh / 2 + Math.sin(a) * d;
      this.introSty.set([this.grad[i * 3], this.grad[i * 3 + 1], this.grad[i * 3 + 2], 0, 1], i * 5);
      this.disp[i * 2] = this.disp[i * 2 + 1] = 0;
      this.vel[i * 2] = this.vel[i * 2 + 1] = 0;
    }
  }

  /** Samples the intro name's glyphs (one "word" per character) for scene 2. */
  private sampleName() {
    const el = document.querySelector<HTMLElement>('[data-orb="intro-name"]');
    if (!el) return;
    const step = innerWidth < 760 ? 2 : 3;
    this.nameText = sampleText(el, '.intro-char', this.n, step);
  }

  private collapseTo(hero: Box, rot: Rotation) {
    for (let i = 0; i < this.n; i++) {
      const q = rotate(this.sphereP, i, rot);
      const k = 0.88 + Math.random() * 0.1;
      this.disp[i * 2] = -q[0] * hero.r * k;
      this.disp[i * 2 + 1] = -q[1] * hero.r * k;
      this.vel[i * 2] = this.vel[i * 2 + 1] = 0;
    }
  }
}

type Rotation = { cy: number; sy: number; cp: number; sp: number };

function rotation(yaw: number, pitch: number): Rotation {
  return { cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch) };
}

const out3: [number, number, number] = [0, 0, 0];

/** Yaw around Y, then pitch around X. Returns a shared tuple; copy what you keep. */
function rotate(points: Float32Array, i: number, r: Rotation) {
  const x = points[i * 3];
  const y = points[i * 3 + 1];
  const z = points[i * 3 + 2];
  const x1 = x * r.cy + z * r.sy;
  const z1 = -x * r.sy + z * r.cy;
  out3[0] = x1;
  out3[1] = y * r.cp - z1 * r.sp;
  out3[2] = y * r.sp + z1 * r.cp;
  return out3;
}

const out2: [number, number] = [0, 0];

/** Interpolates along a gentle arc: particles drift sideways mid-flight, so the stream feels organic. */
function arcMix(ax: number, ay: number, bx: number, by: number, e: number, arc: number, max: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const off = Math.sin(Math.PI * e) * arc * Math.min(len * 0.22, max);
  out2[0] = ax + dx * e + (-dy / len) * off;
  out2[1] = ay + dy * e + (dx / len) * off;
  return out2;
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}
