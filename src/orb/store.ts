/**
 * Tiny shared state between React and the particle engine. The engine reads these values
 * every frame; React writes them from hover, focus and app events. No re-renders involved.
 */

/** Intro scenes the particles play: gather into a small orb, fill the name, become the hero sphere. */
export type IntroStage = 'gather' | 'name' | 'hero' | null;

/** Which "Where my curiosity lives" row is in focus, or null for the plain orb. */
let focus: number | null = null;
let assembleRequest = 0;
let introStage: IntroStage = null;
let ready = false;
const readyListeners = new Set<() => void>();

export const orbStore = {
  get focus() {
    return focus;
  },
  setFocus(index: number | null) {
    focus = index;
  },
  /** Ask the hero orb to resolve from its center, used when the page opens without the intro. */
  assemble() {
    assembleRequest++;
  },
  get assembleRequest() {
    return assembleRequest;
  },
  get introStage() {
    return introStage;
  },
  setIntroStage(stage: IntroStage) {
    introStage = stage;
  },
  /** True once the engine is running and can play the intro. */
  get ready() {
    return ready;
  },
  setReady(value: boolean) {
    ready = value;
    readyListeners.forEach(listener => listener());
  },
  /** Resolves true when the engine is running, or false after `timeout` ms. */
  whenReady(timeout: number) {
    if (ready) return Promise.resolve(true);
    return new Promise<boolean>(resolve => {
      const done = (value: boolean) => {
        clearTimeout(timer);
        readyListeners.delete(listener);
        resolve(value);
      };
      const listener = () => ready && done(true);
      const timer = setTimeout(() => done(false), timeout);
      readyListeners.add(listener);
    });
  },
};

let webgl: boolean | null = null;
const listeners = new Set<() => void>();

/** Called when the renderer fails at runtime, so every orb spot falls back to the static lens. */
export function markWebGLFailed() {
  webgl = false;
  listeners.forEach(listener => listener());
}

export function subscribeWebGL(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function supportsWebGL() {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement('canvas');
    webgl = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return webgl;
}
