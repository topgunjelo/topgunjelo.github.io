import { useRef } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight, Award, BookOpen, Briefcase, GraduationCap, Sparkles } from 'lucide-react';
import { credentials, journey, type JourneyEntry } from '../content/journey';
import { Eyebrow, Reveal } from './Reveal';
import './Journey.css';

const kindIcon = { Education: GraduationCap, Experience: Briefcase, Next: Sparkles };
const groupIcon = { Honors: Award, 'Microsoft Learn': BookOpen, 'Academic activities': GraduationCap };

export function Journey() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start 0.65', 'end 0.6'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <section id="journey" className="chapter journey" aria-labelledby="journey-title">
      <div className="container">
        <header className="chapter-head">
          <Eyebrow index="04">Experience &amp; Education</Eyebrow>
          <Reveal>
            <h2 id="journey-title" className="chapter-title">
              The journey so far<span className="muted">.</span>
            </h2>
          </Reveal>
        </header>

        <div ref={trackRef} className="timeline">
          <span className="timeline-rail" aria-hidden="true">
            <motion.span className="timeline-fill" style={{ scaleY: reduced ? 1 : progress }} />
          </span>
          <ol className="timeline-list">
            {journey.map((entry, index) => (
              <TimelineEntry
                key={`${entry.year}-${entry.title}`}
                entry={entry}
                showYear={index === 0 || journey[index - 1].year !== entry.year}
              />
            ))}
          </ol>
        </div>

        <div className="credentials">
          <Reveal className="credentials-head">
            <h3 className="credentials-title">Credentials &amp; recognition</h3>
          </Reveal>
          <div className="credential-groups">
            {credentials.map((group, index) => {
              const Icon = groupIcon[group.group];
              return (
                <Reveal key={group.group} className="credential-group" delay={index * 0.08}>
                  <h4 className="credential-group-title">
                    <span className="credential-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    {group.group}
                  </h4>
                  <ul>
                    {group.items.map(item => (
                      <li key={item.title} className="credential">
                        {'href' in item ? (
                          <a href={item.href} target="_blank" rel="noopener noreferrer" className="credential-link">
                            <span className="credential-name">{item.title}</span>
                            <ArrowUpRight aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="credential-name">{item.title}</span>
                        )}
                        <span className="credential-detail">{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineEntry({ entry, showYear }: { entry: JourneyEntry; showYear: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const lit = useInView(ref, { margin: '0px 0px -45% 0px' });
  const reduced = useReducedMotion();
  const Icon = kindIcon[entry.kind];

  return (
    <motion.li
      ref={ref}
      className="tl"
      data-lit={lit}
      data-kind={entry.kind}
      initial={{ opacity: 0, y: reduced ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="tl-year" data-repeat={!showYear}>
        {entry.year}
      </span>
      <span className="tl-node" aria-hidden="true">
        <Icon />
      </span>
      <div className="tl-card">
        <p className="tl-kind">{entry.kind === 'Next' ? 'Next chapter' : entry.kind}</p>
        <h3 className="tl-title">{entry.title}</h3>
        <p className="tl-org">{entry.org}</p>
        <p className="tl-meta">{entry.meta}</p>
        {entry.body && <p className="tl-body">{entry.body}</p>}
        {entry.highlights && (
          <ul className="tl-highlights">
            {entry.highlights.map(highlight => (
              <li key={highlight} className="tl-highlight">
                <Award aria-hidden="true" />
                {highlight}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.li>
  );
}
