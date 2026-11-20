export const INTRO_KEY = 'mm:intro-seen';

export type IntroContext = {
  /** Already played in this browser session. */
  seen: boolean;
  /** location.hash — a deep link goes straight to its section. */
  hash: string;
  /** performance navigation type; Back/Forward restores the page instead. */
  navigationType?: string;
};

/** The cinematic intro plays once per session, only on a plain arrival. */
export function shouldPlayIntro({ seen, hash, navigationType }: IntroContext): boolean {
  if (seen) return false;
  if (hash && hash !== '#' && hash !== '#home' && hash !== '#top') return false;
  if (navigationType === 'back_forward') return false;
  return true;
}

export function readIntroContext(): IntroContext {
  let seen = false;
  try {
    seen = sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    // Storage can be blocked; treat it as a first visit.
  }
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return { seen, hash: location.hash, navigationType: nav?.type };
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    // Ignore; the intro may simply play again next load.
  }
}

export function clearIntroSeen() {
  try {
    sessionStorage.removeItem(INTRO_KEY);
  } catch {
    // Ignore.
  }
}
