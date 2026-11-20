import { Scissors } from 'lucide-react';

const files = import.meta.glob<string>('../assets/logos/*.svg', { eager: true, query: '?url', import: 'default' });

/**
 * Technology marks. Most are Devicon SVGs (MIT). Lightroom and Premiere Pro are drawn
 * here in Adobe's current tile style, and CapCut — which has no openly licensed mark —
 * gets a neutral tile, so nothing is a degraded copy of a real logo.
 */
export function TechLogo({ id }: { id: string }) {
  if (id === 'lightroom') return <AdobeTile letters="Lr" background="#001E36" color="#31A8FF" />;
  if (id === 'premierepro') return <AdobeTile letters="Pr" background="#00005B" color="#9999FF" />;
  if (id === 'msword') return <OfficeTile letter="W" back="#41A5EE" front="#185ABD" />;
  if (id === 'msteams') return <OfficeTile letter="T" back="#7B83EB" front="#4B53BC" />;
  if (id === 'capcut') {
    return (
      <span className="logo-tile logo-tile--capcut" aria-hidden="true">
        <Scissors strokeWidth={2.2} />
      </span>
    );
  }
  const src = files[`../assets/logos/${id}.svg`];
  return <img className="logo-img" src={src} alt="" width={56} height={56} loading="lazy" decoding="async" draggable={false} />;
}

/** Microsoft 365 style: a document sheet behind a solid letter plate. Simplified, not the official artwork. */
function OfficeTile({ letter, back, front }: { letter: string; back: string; front: string }) {
  return (
    <svg className="logo-img" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
      <rect x="36" y="10" width="86" height="108" rx="12" fill={back} />
      <rect x="54" y="34" width="56" height="8" rx="4" fill="#fff" opacity="0.55" />
      <rect x="54" y="56" width="56" height="8" rx="4" fill="#fff" opacity="0.55" />
      <rect x="54" y="78" width="56" height="8" rx="4" fill="#fff" opacity="0.55" />
      <rect x="6" y="30" width="68" height="68" rx="12" fill={front} />
      <text x="40" y="81" textAnchor="middle" fill="#fff" fontFamily="var(--font)" fontSize="46" fontWeight="700">
        {letter}
      </text>
    </svg>
  );
}

function AdobeTile({ letters, background, color }: { letters: string; background: string; color: string }) {
  return (
    <svg className="logo-img" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
      <rect x="0" y="2" width="128" height="124" rx="24" fill={background} />
      <text
        x="64"
        y="83"
        textAnchor="middle"
        fill={color}
        fontFamily="var(--font)"
        fontSize="60"
        fontWeight="600"
        letterSpacing="-1"
      >
        {letters}
      </text>
    </svg>
  );
}
