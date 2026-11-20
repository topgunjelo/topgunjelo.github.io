import { useEffect, useRef, type MouseEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from 'motion/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { site } from '../content/site';
import { scrollToSection, useFinePointer, usePauseOffscreen, useRange } from '../lib/hooks';
import { Lens } from './Lens';
import { Magnetic } from './Magnetic';
import { NameGlyphs } from './Name';
import './Hero.css';

type Props = {
  /** The rest of the hero may enter. */
  revealed: boolean;
  /** The intro still owns the name and lens; keep the hero's copies invisible until it lands. */
  coreHidden: boolean;
  /** True when the page opened without the intro, so the name and lens enter on their own. */
  standalone: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

/** custom = [order, base delay]. After the intro, the copy waits for the name to land. */
const rise: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  shown: ([i, base]: [number, number]) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease, delay: base + i * 0.08 },
  }),
};

export function Hero({ revealed, coreHidden, standalone }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = !!useReducedMotion();
  const fine = useFinePointer();
  const inView = usePauseOffscreen(ref);

  // Pointer → lens tilt. Springs keep it fluid and interruptible.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spring = { stiffness: 90, damping: 20, mass: 0.6 };
  const px = useSpring(rawX, spring);
  const py = useSpring(rawY, spring);

  useEffect(() => {
    if (!fine || coreHidden || !inView) return;
    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / innerWidth) * 2 - 1);
      rawY.set((event.clientY / innerHeight) * 2 - 1);
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [fine, coreHidden, inView, rawX, rawY]);

  // Leaving the hero: the lens drifts up and recedes, the copy dims.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const lensY = useRange(scrollYProgress, [0, 1], [0, reduced ? 0 : -140]);
  const lensScale = useRange(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.82]);
  const copyOpacity = useRange(scrollYProgress, [0, 0.65], [1, 0]);
  const copyY = useRange(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]);

  const state = revealed ? 'shown' : 'hidden';
  const base = standalone ? 0.12 : 0.55;
  const coreStyle = coreHidden ? { visibility: 'hidden' as const } : undefined;

  return (
    <section ref={ref} id="home" className="hero" aria-labelledby="hero-name">
      <div className="container hero-inner">
        <motion.div className="hero-top" style={{ opacity: copyOpacity }}>
          <motion.p className="hero-eyebrow" variants={rise} custom={[0, base]} initial="hidden" animate={state}>
            <span className="hero-status" aria-hidden="true" />
            Frontend Developer · Digital Forensics
          </motion.p>
          <motion.h1
            id="hero-name"
            className="hero-name name-type"
            data-hero-name
            style={coreStyle}
            initial={standalone ? { opacity: 0, y: 30, filter: 'blur(12px)' } : false}
            animate={standalone && revealed ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
            transition={{ duration: 1.1, ease }}
          >
            <NameGlyphs />
          </motion.h1>
        </motion.div>

        <div className="hero-grid">
          <motion.div className="hero-copy" style={{ opacity: copyOpacity, y: copyY }}>
            <h2 className="hero-statement">
              <motion.span className="hero-line" variants={rise} custom={[1, base]} initial="hidden" animate={state}>
                {site.headline[0]}
              </motion.span>
              <motion.span className="hero-line spectrum-text" variants={rise} custom={[2, base]} initial="hidden" animate={state}>
                {site.headline[1]}
              </motion.span>
            </h2>
            <motion.p className="hero-intro" variants={rise} custom={[3, base]} initial="hidden" animate={state}>
              {site.intro}
            </motion.p>
            <motion.div className="hero-actions" variants={rise} custom={[4, base]} initial="hidden" animate={state}>
              <Magnetic>
                <a className="btn btn--primary" href="#work" onClick={jump('work', reduced)}>
                  Explore my work <ArrowDown aria-hidden="true" />
                </a>
              </Magnetic>
              <Magnetic>
                <a className="btn btn--secondary" href="#about" onClick={jump('about', reduced)}>
                  About me
                </a>
              </Magnetic>
              <a className="btn btn--ghost" href="#contact" onClick={jump('contact', reduced)}>
                Contact me <ArrowRight aria-hidden="true" />
              </a>
            </motion.div>
          </motion.div>

          <motion.div className="hero-visual" style={{ y: lensY, scale: lensScale }}>
            <motion.div
              className="hero-lens"
              data-hero-lens
              style={coreStyle}
              initial={standalone ? { opacity: 0, scale: 0.86 } : false}
              animate={standalone && revealed ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 1.3, ease }}
            >
              <Lens px={px} py={py} spinning={!coreHidden && !reduced} />
            </motion.div>
          </motion.div>
        </div>

        <motion.div className="hero-scroll-wrap" style={{ opacity: copyOpacity }}>
          <motion.a
            href="#about"
            className="hero-scroll"
            onClick={jump('about', reduced)}
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0, transition: { delay: revealed ? 0.9 : 0, duration: 0.8 } }}
          >
            <span className="hero-scroll-track" aria-hidden="true">
              <span className="hero-scroll-dot" />
            </span>
            <span>Scroll to explore</span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

function jump(id: string, reduced: boolean) {
  return (event: MouseEvent) => {
    event.preventDefault();
    scrollToSection(id, reduced);
  };
}
