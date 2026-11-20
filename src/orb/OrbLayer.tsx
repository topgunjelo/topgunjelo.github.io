import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';
import { markWebGLFailed, orbStore, subscribeWebGL, supportsWebGL } from './store';
import './orb.css';

/** 'particles' when the WebGL orb runs; 'static' for reduced motion or no WebGL. */
export function useOrbMode(): 'particles' | 'static' {
  const reduced = useReducedMotion();
  const webgl = useSyncExternalStore(subscribeWebGL, supportsWebGL, () => false);
  return !reduced && webgl ? 'particles' : 'static';
}

/**
 * One fixed, full-viewport canvas for the whole page. It ignores the pointer (it reads
 * window events instead), so it never blocks links or text selection underneath.
 */
/**
 * Mounted for the whole visit in particle mode, including the intro, which the particles play.
 * `assemble` resolves the hero sphere from its center when the page opened without the intro.
 */
export function OrbLayer({ assemble }: { assemble: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const assembleRef = useRef(assemble);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    // Each engine gets a fresh canvas: disposing forces the old context lost, and a lost
    // context can't be reused (React's dev double-mount would otherwise hit exactly that).
    const canvas = document.createElement('canvas');
    canvas.className = 'orb-layer';
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    let engine: { dispose(): void } | null = null;
    let cancelled = false;
    // Three.js loads on demand, after the intro, so it never delays the first paint.
    import('./engine')
      .then(({ OrbEngine }) => {
        if (cancelled) return;
        engine = new OrbEngine(canvas);
        if (assembleRef.current) orbStore.assemble();
        orbStore.setReady(true);
      })
      .catch(() => {
        // No usable WebGL (or the chunk failed): every orb spot switches to the static lens.
        if (!cancelled) markWebGLFailed();
      });
    return () => {
      cancelled = true;
      orbStore.setReady(false);
      engine?.dispose();
      canvas.remove();
    };
  }, []);
  return <div ref={ref} />;
}
