import { about } from '../content/site';
import { Eyebrow, Reveal, ScrollLitText } from './Reveal';
import './About.css';

export function About() {
  return (
    <section id="about" className="chapter about" aria-labelledby="about-title">
      <div className="container">
        <header className="about-head">
          <Eyebrow index="01">About</Eyebrow>
          <h2 id="about-title" className="visually-hidden">
            About Markie
          </h2>
          <ScrollLitText className="about-statement" text={about.statement} />
        </header>

        <div className="about-body">
          <Reveal className="about-aside">
            <p className="about-aside-title">Where my curiosity lives</p>
            <p className="about-aside-text">
              Four threads run through my work. Most days they overlap: a careful interface, a sound system behind it, an eye
              for what could go wrong, and the visuals that make it worth a look.
            </p>
          </Reveal>

          <ol className="interests">
            {about.interests.map((interest, index) => (
              <Reveal as="li" key={interest.title} delay={index * 0.06}>
                <div className="interest">
                  <span className="interest-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={`interest-orb interest-orb--${interest.tone}`} aria-hidden="true" />
                  <h3 className="interest-title">{interest.title}</h3>
                  <p className="interest-body">{interest.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
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
