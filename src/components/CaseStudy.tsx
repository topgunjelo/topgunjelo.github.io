import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Lock, X } from 'lucide-react';
import { bySlug, pageOrder, type Project } from '../content/projects';
import { useFocusTrap, useScrollLock } from '../lib/hooks';
import { GitHubMark } from './icons';
import { ProjectWindow } from './ProjectWindow';
import './CaseStudy.css';

type Props = { slug: string | null; onNavigate: (slug: string) => void; onClose: () => void };

export function CaseStudy({ slug, onNavigate, onClose }: Props) {
  const project = slug ? bySlug(slug) : undefined;
  return (
    <AnimatePresence>
      {project && <Sheet key="case-study" project={project} onNavigate={onNavigate} onClose={onClose} />}
    </AnimatePresence>
  );
}

function Sheet({ project, onNavigate, onClose }: { project: Project; onNavigate: (slug: string) => void; onClose: () => void }) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useScrollLock(true);
  useFocusTrap(panelRef, true);

  const position = pageOrder.indexOf(project.slug as (typeof pageOrder)[number]);
  const previous = bySlug(pageOrder[(position - 1 + pageOrder.length) % pageOrder.length])!;
  const next = bySlug(pageOrder[(position + 1) % pageOrder.length])!;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [project.slug]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const isPrivate = project.visibility === 'private';

  return (
    <motion.div
      className="cs-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onPointerDown={event => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        ref={panelRef}
        className="cs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cs-title"
        initial={{ opacity: 0, y: reduced ? 0 : 60, scale: reduced ? 1 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduced ? 0 : 60, scale: reduced ? 1 : 0.97 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.55 }}
      >
        <div className="cs-toolbar">
          <span className="cs-toolbar-title" aria-hidden="true">
            {project.title}
          </span>
          <button type="button" className="cs-close" onClick={onClose} aria-label="Close case study">
            <X aria-hidden="true" />
          </button>
        </div>

        <div ref={scrollRef} className="cs-scroll">
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={project.slug}
              className="cs-body"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="cs-head">
                <p className="cs-meta">
                  <span>{project.category}</span>
                  {project.badge && <span className="pj-badge">{project.badge}</span>}
                </p>
                <h2 id="cs-title" ref={titleRef} tabIndex={-1} className="cs-title">
                  {project.title}
                </h2>
                <p className="cs-summary">{project.summary}</p>
                {(project.demo || project.repository) && (
                  <div className="cs-links">
                    {project.demo && (
                      <a className="btn btn--primary" href={project.demo} target="_blank" rel="noopener noreferrer">
                        Visit live site <ArrowUpRight aria-hidden="true" />
                      </a>
                    )}
                    {project.repository && (
                      <a className="btn btn--secondary" href={project.repository} target="_blank" rel="noopener noreferrer">
                        <GitHubMark /> Repository
                      </a>
                    )}
                  </div>
                )}
                {isPrivate && (
                  <p className="cs-private">
                    <Lock aria-hidden="true" /> Private repository. Links and screenshots are not published.
                  </p>
                )}
              </header>

              {project.screenshot && (
                <div className="cs-shot">
                  <ProjectWindow project={project} eager />
                  <p className="cs-caption">{project.screenshot.caption}</p>
                </div>
              )}

              <div className="cs-grid">
                <section className="cs-block">
                  <h3>My role</h3>
                  <p>{project.contribution}</p>
                </section>
                <section className="cs-block">
                  <h3>Built with</h3>
                  <ul className="cs-tech">
                    {project.technologies.map(tech => (
                      <li key={tech} className="chip">
                        {tech}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {project.sections.length > 0 && (
                <section className="cs-features" aria-labelledby="cs-features-title">
                  <h3 id="cs-features-title">{isPrivate ? 'About the project' : 'Key features'}</h3>
                  <ol>
                    {project.sections.map((section, index) => (
                      <li key={section.heading}>
                        <span className="cs-feature-index" aria-hidden="true">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4>{section.heading}</h4>
                          <p>{section.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </motion.article>
          </AnimatePresence>

          <nav className="cs-pager" aria-label="More projects">
            <button type="button" onClick={() => onNavigate(previous.slug)}>
              <ArrowLeft aria-hidden="true" />
              <span>
                <small>Previous</small>
                {previous.title}
              </span>
            </button>
            <button type="button" onClick={() => onNavigate(next.slug)} className="cs-pager-next">
              <span>
                <small>Next</small>
                {next.title}
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          </nav>
        </div>
      </motion.div>
    </motion.div>
  );
}
