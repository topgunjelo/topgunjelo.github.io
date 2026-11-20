import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Command, Menu, Search, X } from 'lucide-react';
import { sections } from '../content/site';
import { useApp } from '../lib/app-context';
import { scrollToSection, useActiveSection } from '../lib/hooks';
import './Nav.css';

const ids = sections.map(section => section.id);
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function Nav({ visible }: { visible: boolean }) {
  const active = useActiveSection(ids);
  const reduced = !!useReducedMotion();
  const { openPalette } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 24);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    const onClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    addEventListener('keydown', onKey);
    addEventListener('pointerdown', onClick);
    return () => {
      removeEventListener('keydown', onKey);
      removeEventListener('pointerdown', onClick);
    };
  }, [menuOpen]);

  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    scrollToSection(id, reduced);
  };

  const current = sections.find(section => section.id === active)?.label ?? 'Home';

  return (
    <motion.header
      className="nav-shell"
      data-scrolled={scrolled}
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: visible ? 0.35 : 0 }}
    >
      <nav className="nav" aria-label="Main" ref={menuRef}>
        <a href="#home" className="nav-mark" onClick={go('home')} aria-label="Markie Mojica, back to top">
          MM
        </a>

        <ul className="nav-links">
          {sections.map(section => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={go(section.id)}
                aria-current={active === section.id ? 'true' : undefined}
                className="nav-link"
              >
                {active === section.id && (
                  <motion.span
                    layoutId="nav-active"
                    className="nav-active"
                    transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
                  />
                )}
                <span className="nav-link-text">{section.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <span className="nav-current" aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={current}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {current}
            </motion.span>
          </AnimatePresence>
        </span>

        <button type="button" className="nav-command" onClick={openPalette} aria-label="Open quick navigation" aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}>
          <Search aria-hidden="true" className="nav-command-search" />
          <kbd className="nav-kbd">
            {isMac ? <Command aria-hidden="true" /> : 'Ctrl'}
            <span>K</span>
          </kbd>
        </button>

        <button
          type="button"
          className="nav-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="nav-sheet"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(open => !open)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={menuOpen ? 'close' : 'open'}
              initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'grid' }}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </motion.span>
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="nav-sheet"
              className="nav-sheet"
              initial={{ opacity: 0, scale: 0.96, y: -8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, y: -8, filter: 'blur(6px)' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            >
              <ul>
                {sections.map((section, index) => (
                  <motion.li
                    key={section.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.03 * index + 0.05 } }}
                  >
                    <a
                      href={`#${section.id}`}
                      onClick={go(section.id)}
                      aria-current={active === section.id ? 'true' : undefined}
                    >
                      {section.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
