import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'motion/react';
import { ArrowUp, ArrowUpRight, Check, Copy, MapPin, Phone, RotateCcw } from 'lucide-react';
import { site } from '../content/site';
import { useApp } from '../lib/app-context';
import { scrollToSection, usePauseOffscreen, useRange } from '../lib/hooks';
import { GitHubMark } from './icons';
import { Lens } from './Lens';
import { Magnetic } from './Magnetic';
import { Eyebrow, Reveal } from './Reveal';
import './Contact.css';

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const reduced = !!useReducedMotion();
  const { copyEmail } = useApp();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const visible = usePauseOffscreen(ref);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const lensScale = useRange(scrollYProgress, [0, 1], [reduced ? 1 : 0.4, 1]);
  const lensY = useRange(scrollYProgress, [0, 1], [reduced ? 0 : 120, 0]);

  return (
    <section ref={ref} id="contact" className="chapter contact" aria-labelledby="contact-title">
      <div className="container contact-inner">
        <motion.div className="contact-lens" style={{ scale: lensScale, y: lensY }}>
          <Lens spinning={visible && !reduced} />
        </motion.div>

        <Eyebrow index="05">Contact</Eyebrow>
        <Reveal>
          <h2 id="contact-title" className="contact-title">
            <span className="muted">Have an idea?</span>
            <span>
              Let’s make it <span className="spectrum-text">remarkable.</span>
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="contact-lede">{site.availability}</p>
        </Reveal>

        <Reveal delay={0.14} className="contact-email-row">
          <a className="contact-email" href={`mailto:${site.email}`}>
            <span className="contact-email-text">{site.email}</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
          <Magnetic strength={0.35}>
            <button
              type="button"
              className="contact-copy"
              data-copied={copied}
              onClick={() => {
                copyEmail();
                setCopied(true);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setCopied(false), 1800);
              }}
              aria-label="Copy email address"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={copied ? 'done' : 'copy'}
                  initial={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  style={{ display: 'grid' }}
                >
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </Magnetic>
        </Reveal>

        <Reveal delay={0.2}>
          <ul className="contact-links">
            <li>
              <Magnetic>
                <a className="btn btn--secondary" href={site.phoneHref}>
                  <Phone aria-hidden="true" /> {site.phone}
                </a>
              </Magnetic>
            </li>
            <li>
              <Magnetic>
                <a className="btn btn--secondary" href={site.github} target="_blank" rel="noopener noreferrer">
                  <GitHubMark /> GitHub
                </a>
              </Magnetic>
            </li>
            <li className="contact-location">
              <MapPin aria-hidden="true" /> {site.location}
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const reduced = !!useReducedMotion();
  const { replayIntro } = useApp();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>
          © {new Date().getFullYear()} {site.fullName}
        </p>
        <div className="footer-links">
          <button type="button" className="footer-link" onClick={replayIntro}>
            <RotateCcw aria-hidden="true" /> Replay intro
          </button>
          <a
            className="footer-link"
            href="#home"
            onClick={event => {
              event.preventDefault();
              scrollToSection('home', reduced);
            }}
          >
            <ArrowUp aria-hidden="true" /> Back to top
          </a>
        </div>
        <p className="footer-note">
          Technology logos from <a href="https://devicon.dev/">Devicon</a> (MIT); marks belong to their owners.
        </p>
      </div>
    </footer>
  );
}
