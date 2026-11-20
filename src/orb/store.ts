/**
 * Tiny shared state between React and the particle engine. The engine reads these values
 * every frame; React writes them from hover, focus and app events. No re-renders involved.
 */

/** Which "Where my curiosity lives" row is in focus, or null for the plain orb. */
let focus: number | null = null;
let assembleRequest = 0;

export const orbStore = {
  get focus() {
    return focus;
  },
  setFocus(index: number | null) {
    focus = index;
  },
  /** Ask the hero orb to resolve from its center, used when the intro hands over. */
  assemble() {
    assembleRequest++;
  },
  get assembleRequest() {
    return assembleRequest;
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
