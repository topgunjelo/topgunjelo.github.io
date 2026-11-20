import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Copy,
  CornerDownLeft,
  FolderOpen,
  Hash,
  Mail,
  Phone,
  RotateCcw,
  Search,
} from 'lucide-react';
import { sections, site } from '../content/site';
import { bySlug, pageOrder } from '../content/projects';
import { useApp } from '../lib/app-context';
import { scrollToSection, useFocusTrap, useScrollLock } from '../lib/hooks';
import { GitHubMark } from './icons';
import './CommandPalette.css';

type Item = {
  id: string;
  group: 'Go to' | 'Projects' | 'Actions';
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Palette onClose={onClose} />}</AnimatePresence>;
}

function Palette({ onClose }: { onClose: () => void }) {
  const reduced = !!useReducedMotion();
  const app = useApp();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  useScrollLock(true);
  useFocusTrap(panelRef, true);

  const items = useMemo<Item[]>(() => {
    const close = (action: () => void) => () => {
      onClose();
      // Let the palette leave before the page moves.
      requestAnimationFrame(() => action());
    };
    return [
      ...sections.map(section => ({
        id: `go-${section.id}`,
        group: 'Go to' as const,
        label: section.label,
        icon: <Hash aria-hidden="true" />,
        run: close(() => scrollToSection(section.id, reduced)),
      })),
      ...pageOrder.map(slug => {
        const project = bySlug(slug)!;
        return {
          id: `project-${slug}`,
          group: 'Projects' as const,
          label: project.title,
          hint: project.category,
          keywords: project.technologies.join(' '),
          icon: <FolderOpen aria-hidden="true" />,
          run: close(() => app.openProject(slug)),
        };
      }),
      {
        id: 'copy-email',
        group: 'Actions',
        label: 'Copy email address',
        hint: site.email,
        icon: <Copy aria-hidden="true" />,
        run: close(app.copyEmail),
      },
      {
        id: 'send-email',
        group: 'Actions',
        label: 'Send an email',
        hint: site.email,
        keywords: 'mail contact',
        icon: <Mail aria-hidden="true" />,
        run: close(() => location.assign(`mailto:${site.email}`)),
      },
      {
        id: 'call',
        group: 'Actions',
        label: 'Call',
        hint: site.phone,
        keywords: 'phone mobile contact',
        icon: <Phone aria-hidden="true" />,
        run: close(() => location.assign(site.phoneHref)),
      },
      {
        id: 'github',
        group: 'Actions',
        label: 'Open GitHub profile',
        hint: `@${site.githubHandle}`,
        keywords: 'code repositories',
        icon: <GitHubMark />,
        run: close(() => window.open(site.github, '_blank', 'noopener')),
      },
      {
        id: 'replay',
        group: 'Actions',
        label: 'Replay intro',
        icon: <RotateCcw aria-hidden="true" />,
        run: close(app.replayIntro),
      },
    ];
  }, [app, onClose, reduced]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''} ${item.group}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  const selected = Math.min(index, Math.max(results.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIndex((selected + 1) % Math.max(results.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIndex((selected - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      results[selected]?.run();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  let lastGroup = '';

  return (
        <motion.div
          className="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onPointerDown={event => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Quick navigation"
            initial={{ opacity: 0, scale: 0.97, y: -12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.97, y: -12, filter: 'blur(8px)' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            onKeyDown={onKeyDown}
          >
            <div className="palette-search">
              <Search aria-hidden="true" />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={results[selected] ? `${listId}-${results[selected].id}` : undefined}
                aria-autocomplete="list"
                placeholder="Search sections, projects, actions…"
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setIndex(0);
                }}
              />
              <kbd className="palette-esc">esc</kbd>
            </div>

            <ul ref={listRef} id={listId} role="listbox" className="palette-list" aria-label="Results">
              {results.length === 0 && <li className="palette-empty">No matches for “{query}”.</li>}
              {results.map((item, i) => {
                const heading = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <li key={item.id} role="presentation">
                    {heading && (
                      <p className="palette-group" aria-hidden="true">
                        {heading}
                      </p>
                    )}
                    <div
                      id={`${listId}-${item.id}`}
                      role="option"
                      aria-selected={i === selected}
                      data-index={i}
                      className="palette-item"
                      onPointerMove={() => i !== selected && setIndex(i)}
                      onClick={item.run}
                    >
                      <span className="palette-icon">{item.icon}</span>
                      <span className="palette-label">{item.label}</span>
                      {item.hint && <span className="palette-hint">{item.hint}</span>}
                      {i === selected ? (
                        <CornerDownLeft className="palette-enter" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="palette-arrow" aria-hidden="true" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="palette-foot" aria-hidden="true">
              <span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
              <span><kbd>↵</kbd> to open</span>
            </div>
          </motion.div>
        </motion.div>
  );
}
