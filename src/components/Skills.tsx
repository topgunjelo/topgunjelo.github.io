import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { FileText, Film, LayoutTemplate, Megaphone } from 'lucide-react';
import { capabilities, categories, categoryLabel, stack, studying, type StackCategory, type Tech } from '../content/stack';
import { useFinePointer, usePauseOffscreen } from '../lib/hooks';
import { Eyebrow, Reveal } from './Reveal';
import { TechLogo } from './TechLogo';
import './Skills.css';

type Filter = 'all' | StackCategory;

const capabilityIcons = { layout: LayoutTemplate, film: Film, file: FileText, megaphone: Megaphone };

export function Skills() {
  const [filter, setFilter] = useState<Filter>('all');
  const [active, setActive] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotion();
  const fine = useFinePointer();
  usePauseOffscreen(fieldRef);

  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });

  useEffect(() => {
    const field = fieldRef.current;
    if (!fine || !field) return;
    const onMove = (event: PointerEvent) => {
      const box = field.getBoundingClientRect();
      mx.set(((event.clientX - box.left) / box.width) * 2 - 1);
      my.set(((event.clientY - box.top) / box.height) * 2 - 1);
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };
    field.addEventListener('pointermove', onMove);
    field.addEventListener('pointerleave', onLeave);
    return () => {
      field.removeEventListener('pointermove', onMove);
      field.removeEventListener('pointerleave', onLeave);
    };
  }, [fine, mx, my]);

  const visible = stack.filter(tech => filter === 'all' || tech.category === filter);
  const current = stack.find(tech => tech.id === active);

  return (
    <section id="skills" className="chapter skills" aria-labelledby="skills-title">
      <div className="container">
        <header className="chapter-head skills-head">
          <Eyebrow index="02">Skills</Eyebrow>
          <Reveal>
            <h2 id="skills-title" className="chapter-title">
              The toolkit<span className="muted">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="chapter-lede">
              Languages I write, software I design and edit with, and the tools that hold it together. Hover or tap any mark.
            </p>
          </Reveal>
        </header>

        <Reveal className="skills-filter-wrap" delay={0.1}>
          <LayoutGroup id="skills-filter">
            <div className="segmented" role="radiogroup" aria-label="Filter technologies">
              {categories.map(category => {
                const selected = filter === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className="segmented-option"
                    onClick={() => {
                      setFilter(category.id);
                      setActive(null);
                    }}
                  >
                    {selected && (
                      <motion.span
                        layoutId="segmented-thumb"
                        className="segmented-thumb"
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                      />
                    )}
                    <span className="segmented-label">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </Reveal>

        <div ref={fieldRef} className="constellation">
          <div className="constellation-glow" aria-hidden="true" />
          <ul className="constellation-list" aria-label="Technologies">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((tech, index) => (
                <TechItem
                  key={tech.id}
                  tech={tech}
                  index={index}
                  mx={mx}
                  my={my}
                  reduced={reduced}
                  active={active === tech.id}
                  onActivate={() => setActive(tech.id)}
                  onDeactivate={() => setActive(id => (id === tech.id ? null : id))}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="tech-detail" id="tech-detail" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current?.id ?? filter}
              className="tech-detail-inner"
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.25 }}
            >
              {current ? (
                <>
                  <span className="tech-detail-dot" style={{ background: current.color }} aria-hidden="true" />
                  <strong>{current.name}</strong>
                  <span className="tech-detail-cat">{categoryLabel[current.category]}</span>
                  <span className="tech-detail-note">{current.note}</span>
                </>
              ) : (
                <span className="tech-detail-note">
                  {visible.length} {filter === 'all' ? 'technologies' : categoryLabel[filter as StackCategory].toLowerCase() + ' tools'}.{' '}
                  {fine ? 'Hover' : 'Tap'} a mark to see how I use it.
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="capabilities">
          {capabilities.map((capability, index) => {
            const Icon = capabilityIcons[capability.icon];
            return (
              <Reveal key={capability.title} className="capability" delay={index * 0.06}>
                <span className="capability-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{capability.title}</h3>
                <p>{capability.body}</p>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="studying">
          <p className="studying-label">Studying in my specialization</p>
          <ul className="studying-list">
            {studying.map(topic => (
              <li key={topic} className="chip">
                {topic}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

type ItemProps = {
  tech: Tech;
  index: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  reduced: boolean;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
};

function TechItem({ tech, index, mx, my, reduced, active, onActivate, onDeactivate }: ItemProps) {
  const x = useTransform(mx, v => v * tech.depth * -16);
  const y = useTransform(my, v => v * tech.depth * -12);
  const style = {
    '--glow': tech.color,
    '--float-delay': `${(index * -0.73) % 6}s`,
    '--float-duration': `${6 + tech.depth * 3}s`,
  } as CSSProperties;

  return (
    <motion.li
      layout={!reduced}
      className="tech-item"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', bounce: 0, duration: 0.55 }}
      style={style}
    >
      <motion.div style={{ x, y }} className="tech-parallax">
        <button
          type="button"
          className="tech"
          data-active={active}
          aria-label={tech.name}
          aria-describedby="tech-detail"
          onPointerEnter={event => event.pointerType === 'mouse' && onActivate()}
          onPointerLeave={event => event.pointerType === 'mouse' && onDeactivate()}
          onFocus={onActivate}
          onBlur={onDeactivate}
          onClick={onActivate}
        >
          <span className="tech-float">
            <span className="tech-tile">
              <TechLogo id={tech.id} />
            </span>
          </span>
          <span className="tech-tip" aria-hidden="true">
            {tech.name}
          </span>
        </button>
      </motion.div>
    </motion.li>
  );
}
