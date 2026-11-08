import { createRoot } from 'react-dom/client';
import AnimatedContent from './components/AnimatedContent.jsx';

export function initReactBits() {
  const targets = document.querySelectorAll('[data-react-bits]');
  if (!targets.length) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const roots = new Map();

  function clear() {
    for (const root of roots.values()) root.unmount();
    roots.clear();
  }

  function sync() {
    if (motion.matches) {
      clear();
      return;
    }

    for (const target of targets) {
      if (roots.has(target)) continue;
      const root = createRoot(target);
      roots.set(target, root);
      root.render(
        <AnimatedContent
          as="span"
          className="react-bits-reveal"
          aria-hidden="true"
          direction="horizontal"
          distance={26}
          duration={0.85}
          threshold={0.18}
          wipe="right"
        >
          <span className="react-bits-accent" />
        </AnimatedContent>,
      );
    }
  }

  motion.addEventListener('change', sync);
  sync();

  return () => {
    motion.removeEventListener('change', sync);
    clear();
  };
}
