import { useEffect, useRef, useState } from 'react';
import { motion, stagger, useAnimate, useReducedMotion } from 'motion/react';
import { site } from '../content/site';
import { useScrollLock } from '../lib/hooks';
import { useOrbMode } from '../orb/OrbLayer';
import { orbStore } from '../orb/store';
import { Lens } from './Lens';
import { NameGlyphs } from './Name';
import './Intro.css';

type Props = {
  /** The hero starts arriving underneath while the name and lens travel. */
  onHandoff: () => void;
  /** The travelling pieces have landed on the hero's own name and lens. */
  onDone: () => void;
};

const glide = [0.76, 0, 0.24, 1] as const;
const settle = [0.22, 1, 0.36, 1] as const;
const DOT = 56;

/**
 * Scene 1: a single point of light appears on white.
 * Scene 2: the name resolves letter by letter, then the three roles.
 * Scene 3: the name glides into the hero heading and the point grows into the hero lens.
 */
export function Intro({ onHandoff, onDone }: Props) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const orbRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const finished = useRef(false);
  const reduced = useReducedMotion();
  const particleMode = useOrbMode() === 'particles';
  // The CSS lens only appears when the particle orb can't tell the story.
  const [classic, setClassic] = useState(false);
  useScrollLock(true);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      // Particles hand over to the page formation (the hero sphere) without a jump.
      orbStore.setIntroStage(null);
      onHandoff();
      onDone();
    };

    const skip = () => {
      if (finished.current) return;
      cancelled = true;
      finish();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip();
    };
    addEventListener('keydown', onKey);
    addEventListener('resize', skip);

    async function play() {
      history.scrollRestoration = 'manual';
      scrollTo(0, 0);
      await Promise.race([document.fonts.ready, wait(900)]);
      if (cancelled) return;
      // The particle orb tells the whole story when it's available; give it a moment to load.
      if (particleMode && (await orbStore.whenReady(1500))) return playParticles();
      if (cancelled) return;
      setClassic(true);
      await wait(40); // let the lens element mount

      const orb = orbRef.current!;
      const anchor = anchorRef.current!.getBoundingClientRect();
      const heroLens = document.querySelector<HTMLElement>('[data-hero-lens]');
      const heroName = document.querySelector<HTMLElement>('[data-hero-name]');
      const lensSize = heroLens?.getBoundingClientRect().width || 420;

      // The orb is drawn at full hero size and scaled down, so it stays crisp as it grows.
      orb.style.width = orb.style.height = `${lensSize}px`;
      const dotScale = DOT / lensSize;
      const dotX = anchor.left + anchor.width / 2 - lensSize / 2;
      const dotY = anchor.top + anchor.height / 2 - lensSize / 2;

      await animate(orb, { x: dotX, y: dotY, scale: dotScale }, { duration: 0 });

      if (reduced) {
        // Same story, told with opacity alone.
        await Promise.all([
          animate(orb, { opacity: [0, 1] }, { duration: 0.6 }),
          animate('.intro-char', { opacity: [0, 1] }, { duration: 0.6 }),
          animate('.intro-role', { opacity: [0, 1] }, { duration: 0.6, delay: 0.3 }),
        ]);
        await wait(1400);
        if (!cancelled) finish();
        return;
      }

      // Scene 1 — arrival
      await animate(orb, { scale: [dotScale * 0.2, dotScale], opacity: [0, 1] }, { duration: 0.8, ease: settle });
      if (cancelled) return;

      // Scene 2 — identity
      animate(
        '.intro-char',
        { opacity: [0, 1], y: ['0.35em', '0em'], filter: ['blur(14px)', 'blur(0px)'] },
        { duration: 0.95, ease: settle, delay: stagger(0.038) },
      );
      await wait(700);
      if (cancelled) return;
      await animate(
        '.intro-role',
        { opacity: [0, 1], y: [10, 0], filter: ['blur(8px)', 'blur(0px)'] },
        { duration: 0.75, ease: settle, delay: stagger(0.16) },
      );
      await wait(650);
      if (cancelled || !heroLens || !heroName) return finish();

      // Scene 3 — the handoff
      onHandoff();
      const name = nameRef.current!;
      const from = name.getBoundingClientRect();
      const to = heroName.getBoundingClientRect();
      const lens = heroLens.getBoundingClientRect();
      const scale = to.width / from.width;

      await Promise.all([
        animate(scope.current, { backgroundColor: 'rgba(255,255,255,0)' }, { duration: 0.7, ease: 'easeOut' }),
        animate('.intro-roles', { opacity: 0, y: -8 }, { duration: 0.35, ease: 'easeIn' }),
        animate('.intro-skip', { opacity: 0 }, { duration: 0.25 }),
        animate(
          name,
          {
            x: to.left + to.width / 2 - (from.left + from.width / 2),
            y: to.top + to.height / 2 - (from.top + from.height / 2),
            scale,
          },
          { duration: 1.15, ease: glide },
        ),
        animate(orb, { x: lens.left, y: lens.top, scale: 1 }, { duration: 1.25, ease: glide, delay: 0.06 }),
      ]);
      if (!cancelled) finish();
    }

    /**
     * The particle version, one continuous object:
     * Scene 1 — scattered particles gather into a small dot-matrix orb.
     * Scene 2 — the orb pours into the letters of the name; each letter sharpens as its dots land.
     * Scene 3 — the name glides into the hero heading while its particles become the hero sphere.
     */
    async function playParticles() {
      orbStore.setIntroStage('gather');
      await wait(1350);
      if (cancelled) return;

      orbStore.setIntroStage('name');
      // Left to right, in step with the engine's per-letter arrival delay.
      animate(
        '.intro-char',
        { opacity: [0, 1], filter: ['blur(12px)', 'blur(0px)'] },
        { duration: 0.8, ease: settle, delay: stagger(0.045, { startDelay: 0.4 }) },
      );
      await wait(1500);
      if (cancelled) return;
      await animate(
        '.intro-role',
        { opacity: [0, 1], y: [10, 0], filter: ['blur(8px)', 'blur(0px)'] },
        { duration: 0.75, ease: settle, delay: stagger(0.16) },
      );
      await wait(550);
      const heroName = document.querySelector<HTMLElement>('[data-hero-name]');
      if (cancelled || !heroName) return finish();

      onHandoff();
      orbStore.setIntroStage('hero');
      const name = nameRef.current!;
      const from = name.getBoundingClientRect();
      const to = heroName.getBoundingClientRect();
      await Promise.all([
        animate(scope.current, { backgroundColor: 'rgba(255,255,255,0)' }, { duration: 0.7, ease: 'easeOut' }),
        animate('.intro-roles', { opacity: 0, y: -8 }, { duration: 0.35, ease: 'easeIn' }),
        animate('.intro-skip', { opacity: 0 }, { duration: 0.25 }),
        animate(
          name,
          {
            x: to.left + to.width / 2 - (from.left + from.width / 2),
            y: to.top + to.height / 2 - (from.top + from.height / 2),
            scale: to.width / from.width,
          },
          { duration: 1.15, ease: glide },
        ),
        wait(1300),
      ]);
      if (!cancelled) finish();
    }

    play();
    return () => {
      cancelled = true;
      orbStore.setIntroStage(null);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', skip);
    };
  }, [animate, onDone, onHandoff, reduced, scope, particleMode]);

  return (
    <motion.div
      ref={scope}
      className="intro"
      exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
    >
      {classic && (
        <div ref={orbRef} className="intro-orb" aria-hidden="true">
          <Lens />
        </div>
      )}
      <div className="intro-stage" aria-hidden="true">
        <div ref={anchorRef} className="intro-anchor" data-orb={classic ? undefined : 'intro-orb'} />
        <p ref={nameRef} className="intro-name name-type" data-orb="intro-name">
          <NameGlyphs className="name-char intro-char" />
        </p>
        <p className="intro-roles">
          {site.roles.map(role => (
            <span key={role} className="intro-role">
              {role}
            </span>
          ))}
        </p>
      </div>
      <button
        type="button"
        className="intro-skip"
        onClick={() => {
          if (!finished.current) {
            finished.current = true;
            orbStore.setIntroStage(null);
            onHandoff();
            onDone();
          }
        }}
      >
        Skip intro
      </button>
    </motion.div>
  );
}
