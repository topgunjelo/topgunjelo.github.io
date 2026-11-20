import { site } from '../content/site';

/**
 * The box around the visible glyphs of a name element. The hero heading is a full-width
 * block, so its own box is far wider than the letters; FLIP must aim at the letters.
 */
export function glyphBox(el: HTMLElement) {
  const chars = el.querySelectorAll<HTMLElement>('.name-char');
  if (!chars.length) return el.getBoundingClientRect();
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  chars.forEach(char => {
    const r = char.getBoundingClientRect();
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  });
  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Transform that moves `el`'s glyphs exactly onto `target`'s glyphs, accounting for `el`
 * scaling around its own center (its transform-origin), not the glyphs' center.
 */
export function flipOnto(el: HTMLElement, target: HTMLElement) {
  const box = el.getBoundingClientRect();
  const from = glyphBox(el);
  const to = glyphBox(target);
  const scale = to.width / from.width;
  const ox = box.left + box.width / 2;
  const oy = box.top + box.height / 2;
  const fx = from.left + from.width / 2;
  const fy = from.top + from.height / 2;
  return {
    x: to.left + to.width / 2 - (ox + (fx - ox) * scale),
    y: to.top + to.height / 2 - (oy + (fy - oy) * scale),
    scale,
  };
}

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
