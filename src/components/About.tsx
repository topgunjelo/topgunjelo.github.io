import { useEffect, useRef } from 'react';
import { about } from '../content/site';
import { useMediaQuery } from '../lib/hooks';
import { useOrbMode } from '../orb/OrbLayer';
import { orbStore } from '../orb/store';
import { Lens } from './Lens';
import { Eyebrow, Reveal, ScrollLitText } from './Reveal';
import './About.css';

export function About() {
  const particles = useOrbMode() === 'particles';
  const hover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const listRef = useRef<HTMLOListElement>(null);

  // Without hover (touch), the row nearest the middle of the screen drives the orb instead.
  useEffect(() => {
    const list = listRef.current;
    if (hover || !list) return;
    const rows = [...list.querySelectorAll<HTMLElement>('[data-interest]')];
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) orbStore.setFocus(Number((entry.target as HTMLElement).dataset.interest));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    rows.forEach(row => observer.observe(row));
    return () => observer.disconnect();
  }, [hover]);

  useEffect(() => () => orbStore.setFocus(null), []);

  return (
    <section id="about" className="chapter about" aria-labelledby="about-title">
      <div className="container">
        <header className="about-head">
          <Eyebrow index="01">About</Eyebrow>
          <h2 id="about-title" className="visually-hidden">
            About Markie
          </h2>
          <ScrollLitText className="about-statement" text={about.statement} orb={particles ? 'text' : undefined} />
        </header>

        <div className="about-body" data-orb={particles ? 'zone' : undefined}>
          <div className="about-main">
            <Reveal className="about-intro">
              <p className="about-aside-title">Where my curiosity lives</p>
              <p className="about-aside-text">
                Four threads run through my work. Most days they overlap: a careful interface, a sound system behind it, an
                eye for what could go wrong, and the visuals that make it worth a look.
              </p>
            </Reveal>

            <ol className="interests" ref={listRef} onMouseLeave={() => orbStore.setFocus(null)}>
              {about.interests.map((interest, index) => (
                <Reveal as="li" key={interest.title} delay={index * 0.06}>
                  <div
                    className="interest"
                    data-interest={index}
                    data-tone={interest.tone}
                    onMouseEnter={() => orbStore.setFocus(index)}
                  >
                    <span className="interest-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="interest-title">{interest.title}</h3>
                    <p className="interest-body">{interest.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="about-companion" aria-hidden="true">
            <div className="companion-anchor orb-anchor" data-orb={particles ? 'companion' : undefined}>
              {particles ? <div className="orb-aura orb-aura--soft" /> : <Lens />}
            </div>
          </div>
        </div>

        <dl className="facts">
          {about.facts.map((fact, index) => (
            <Reveal key={fact.label} className="fact" delay={index * 0.08}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
