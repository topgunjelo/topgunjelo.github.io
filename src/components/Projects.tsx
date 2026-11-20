import { useRef, type MouseEvent, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll } from 'motion/react';
import { ArrowUpRight, Lock, MessageCircle, Moon, ShieldCheck } from 'lucide-react';
import { bySlug, kilosFlow, lab, showcase, type Project } from '../content/projects';
import { useApp } from '../lib/app-context';
import { useRange } from '../lib/hooks';
import { ProjectWindow } from './ProjectWindow';
import { Eyebrow, Reveal } from './Reveal';
import './Projects.css';

export function Projects() {
  const items = showcase.map(item => ({ ...item, project: bySlug(item.slug)! }));
  const pair = items.filter(item => item.layout === 'pair');
  let number = 0;
  const next = () => String(++number).padStart(2, '0');

  return (
    <section id="work" className="chapter work" aria-labelledby="work-title">
      <div className="container">
        <header className="chapter-head">
          <Eyebrow index="03">Projects</Eyebrow>
          <Reveal>
            <h2 id="work-title" className="chapter-title">
              Selected work<span className="muted">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="chapter-lede">
              A client site, team systems and research. Each one says what I actually built. Open any project for the full
              case study.
            </p>
          </Reveal>
        </header>

        <div className="work-list">
          {items.map(item => {
            if (item.layout === 'feature') return <Feature key={item.slug} project={item.project} index={next()} />;
            if (item.layout === 'flow') return <Flow key={item.slug} project={item.project} index={next()} />;
            if (item.layout === 'pair') {
              if (item.slug !== pair[0].slug) return null;
              return (
                <div key="pair" className="pj-pair">
                  {pair.map((entry, i) => (
                    <Compact key={entry.slug} project={entry.project} index={next()} delay={i * 0.1} />
                  ))}
                </div>
              );
            }
            return <Split key={item.slug} project={item.project} index={next()} flip={false} />;
          })}
        </div>

        <div className="lab">
          <Reveal className="lab-head">
            <h3 className="lab-title">In the lab</h3>
            <p className="lab-text">Private repositories, described at a high level. No links or screenshots are published.</p>
          </Reveal>
          <ul className="lab-grid">
            {lab.map((slug, i) => (
              <LabCard key={slug} project={bySlug(slug)!} index={next()} delay={i * 0.08} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The whole card opens the case study; the title link carries the name for assistive tech. */
function OpenLink({ project, children }: { project: Project; children: ReactNode }) {
  const { openProject } = useApp();
  return (
    <a
      href={`#project-${project.slug}`}
      className="pj-open"
      onClick={(event: MouseEvent) => {
        event.preventDefault();
        openProject(project.slug);
      }}
    >
      {children}
    </a>
  );
}

function Meta({ project, index }: { project: Project; index: string }) {
  return (
    <p className="pj-meta">
      <span className="pj-index">{index}</span>
      <span>{project.category}</span>
      {project.badge && <span className="pj-badge">{project.badge}</span>}
    </p>
  );
}

function Cue({ label = 'View case study' }: { label?: string }) {
  return (
    <span className="pj-cue" aria-hidden="true">
      {label}
      <ArrowUpRight />
    </span>
  );
}

function Tech({ items, limit = 5 }: { items: string[]; limit?: number }) {
  return (
    <ul className="pj-tech" aria-label="Technologies">
      {items.slice(0, limit).map(tech => (
        <li key={tech}>{tech}</li>
      ))}
      {items.length > limit && <li className="pj-tech-more">+{items.length - limit}</li>}
    </ul>
  );
}

function Feature({ project, index }: { project: Project; index: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: frame, offset: ['start end', 'center center'] });
  const scale = useRange(scrollYProgress, [0, 1], [reduced ? 1 : 0.88, 1]);
  const y = useRange(scrollYProgress, [0, 1], [reduced ? 0 : 60, 0]);

  return (
    <article className="pj pj--feature">
      <Reveal className="pj-feature-head">
        <Meta project={project} index={index} />
        <h3 className="pj-title pj-title--xl">
          <OpenLink project={project}>{project.title}</OpenLink>
        </h3>
      </Reveal>
      <motion.div ref={frame} className="pj-stage" style={{ scale, y }}>
        <ProjectWindow project={project} />
        <Cue />
      </motion.div>
      <Reveal className="pj-feature-foot">
        <p className="pj-summary">{project.summary}</p>
        <div className="pj-role">
          <p className="pj-label">My role</p>
          <p>{project.contribution}</p>
          <Tech items={project.technologies} />
        </div>
      </Reveal>
    </article>
  );
}

function Flow({ project, index }: { project: Project; index: string }) {
  const reduced = useReducedMotion();
  return (
    <article className="pj pj--flow">
      <Reveal className="pj-flow-copy">
        <Meta project={project} index={index} />
        <h3 className="pj-title pj-title--lg">
          <OpenLink project={project}>{project.title}</OpenLink>
        </h3>
        <p className="pj-summary">{project.summary}</p>
        <Tech items={project.technologies} limit={7} />
        <Cue />
      </Reveal>
      <motion.ol
        className="flow"
        aria-label="How a case moves through KilosUnlad"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '0px 0px -20% 0px' }}
        transition={{ staggerChildren: reduced ? 0 : 0.22 }}
      >
        {kilosFlow.map((step, i) => (
          <motion.li
            key={step.step}
            className="flow-step"
            variants={{
              hidden: { opacity: 0, x: reduced ? 0 : 24 },
              shown: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <span className="flow-dot" aria-hidden="true">
              {i + 1}
            </span>
            <span className="flow-step-name">{step.step}</span>
            <span className="flow-step-text">{step.text}</span>
          </motion.li>
        ))}
      </motion.ol>
    </article>
  );
}

function Compact({ project, index, delay }: { project: Project; index: string; delay: number }) {
  return (
    <Reveal as="div" className="pj pj--compact" delay={delay}>
      <div className="pj-stage pj-stage--compact">
        <ProjectWindow project={project} />
        <Cue />
      </div>
      <Meta project={project} index={index} />
      <h3 className="pj-title">
        <OpenLink project={project}>{project.title}</OpenLink>
      </h3>
      <p className="pj-summary pj-summary--sm">{project.summary}</p>
    </Reveal>
  );
}

function Split({ project, index, flip }: { project: Project; index: string; flip: boolean }) {
  return (
    <article className="pj pj--split" data-flip={flip}>
      <Reveal className="pj-stage pj-stage--split" y={40}>
        <ProjectWindow project={project} />
        <Cue />
      </Reveal>
      <Reveal className="pj-split-copy" delay={0.1}>
        <Meta project={project} index={index} />
        <h3 className="pj-title pj-title--lg">
          <OpenLink project={project}>{project.title}</OpenLink>
        </h3>
        <p className="pj-summary">{project.summary}</p>
        <p className="pj-label">My role</p>
        <p className="pj-role-text">{project.contribution}</p>
        <Tech items={project.technologies} />
      </Reveal>
    </article>
  );
}

const labArt = {
  noctime: { icon: Moon, tone: 'dusk' },
  'aegis-ntfs': { icon: ShieldCheck, tone: 'steel' },
  sponge: { icon: MessageCircle, tone: 'sea' },
} as const;

function LabCard({ project, index, delay }: { project: Project; index: string; delay: number }) {
  const art = labArt[project.slug as keyof typeof labArt];
  const Icon = art.icon;
  return (
    <Reveal as="li" className="lab-item" delay={delay}>
      <div className={`pj lab-card lab-card--${art.tone}`}>
        <div className="lab-art" aria-hidden="true">
          <Icon strokeWidth={1.5} />
        </div>
        <p className="pj-meta">
          <span className="pj-index">{index}</span>
          <span>{project.category}</span>
        </p>
        <h4 className="pj-title">
          <OpenLink project={project}>{project.title}</OpenLink>
        </h4>
        <p className="pj-summary pj-summary--sm">{project.summary}</p>
        <p className="lab-private">
          <Lock aria-hidden="true" />
          {project.badge}
        </p>
      </div>
    </Reveal>
  );
}
