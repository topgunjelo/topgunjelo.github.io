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
