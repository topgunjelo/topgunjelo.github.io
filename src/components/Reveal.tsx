import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, type MotionValue } from 'motion/react';
import { useRange } from '../lib/hooks';

const ease = [0.22, 1, 0.36, 1] as const;

/** Rises into place once, as it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'header' | 'p';
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: reduced ? 0.4 : 0.9, ease, delay }}
    >
      {children}
    </Tag>
  );
}

/** Words light up one by one as the reader scrolls through them. */
export function ScrollLitText({ text, className, orb }: { text: string; className?: string; orb?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] });
  const words = text.split(' ');
  if (reduced) {
    return (
      <p ref={ref} className={className}>
        {text}
      </p>
    );
  }
  return (
    <p ref={ref} className={className} data-orb={orb}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          // Same timing the orb engine uses to land particles on word `index`, so each word
          // darkens as its dots arrive.
          <Word key={index} progress={scrollYProgress} range={[(index / words.length) * 0.84 + 0.04, (index / words.length) * 0.84 + 0.18]}>
            {word}
          </Word>
        ))}
      </span>
    </p>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useRange(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span className="lit-word" style={{ opacity }}>
        {children}
      </motion.span>{' '}
    </>
  );
}

/** A small chapter label: index, rule, name. */
export function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <Reveal as="p" className="eyebrow" y={12}>
      <span className="eyebrow-index">{index}</span>
      <span className="eyebrow-rule" aria-hidden="true" />
      {children}
    </Reveal>
  );
}
