import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react';
import { useInView, useReducedMotion, useTransform, type MotionValue } from 'motion/react';

/**
 * Maps a scroll progress value onto a clamped output range. A function transform keeps the
 * work in JS: Motion would otherwise hand plain range transforms of useScroll to the browser's
 * native ViewTimeline, which froze mid-way when the page had been scroll-locked by the intro.
 */
export function useRange(value: MotionValue<number>, [a, b]: [number, number], [from, to]: [number, number]) {
  return useTransform(value, v => {
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return from + (to - from) * t;
  });
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    callback => {
      const list = matchMedia(query);
      list.addEventListener('change', callback);
      return () => list.removeEventListener('change', callback);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** Rich pointer effects only where there is a precise, hovering pointer and motion is welcome. */
export function useFinePointer() {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduced = useReducedMotion();
  return fine && !reduced;
}

/** Marks an element data-offscreen so its CSS loops pause while it can't be seen. */
export function usePauseOffscreen(ref: RefObject<HTMLElement | null>) {
  const inView = useInView(ref, { margin: '120px 0px' });
  useEffect(() => {
    if (ref.current) ref.current.dataset.offscreen = String(!inView);
  }, [inView, ref]);
  return inView;
}

/** The section currently under the reading line. */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = innerHeight * 0.38;
      const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
      let current = ids[0];
      if (atBottom) current = ids[ids.length - 1];
      else {
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= line) current = id;
        }
      }
      setActive(current);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', queue);
      removeEventListener('resize', queue);
    };
  }, [ids]);
  return active;
}

export function scrollToSection(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(history.state, '', id === 'home' ? location.pathname + location.search : `#${id}`);
}

/** Locks page scroll while a modal surface is open, without layout shift. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    const gap = innerWidth - root.clientWidth;
    const previous = { overflow: root.style.overflow, padding: root.style.paddingRight };
    root.style.overflow = 'hidden';
    if (gap > 0) root.style.paddingRight = `${gap}px`;
    return () => {
      root.style.overflow = previous.overflow;
      root.style.paddingRight = previous.padding;
    };
  }, [locked]);
}

/** Keeps Tab inside a dialog and returns focus to where it came from on close. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const selector = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(selector)].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [active, ref]);
}
