import { site } from '../content/site';

/**
 * The display name, one span per glyph. The intro and the hero render it identically,
 * so the intro's copy can land on the hero's without a visible seam.
 */
export function NameGlyphs({ className = 'name-char' }: { className?: string }) {
  return (
    <>
      {site.name.split('').map((char, index) => (
        <span key={index} className={className} aria-hidden="true">
          {char === ' ' ? ' ' : char}
        </span>
      ))}
      <span className="visually-hidden">{site.name}</span>
    </>
  );
}
