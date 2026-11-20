import { motion, useMotionTemplate, useTransform, type MotionValue } from 'motion/react';
import './Lens.css';

type Props = {
  /** Spring-smoothed pointer position, -1…1 on each axis. Omit for a still lens. */
  px?: MotionValue<number>;
  py?: MotionValue<number>;
  spinning?: boolean;
  className?: string;
};

/**
 * The lens: the site's one visual object. A glass sphere of slow, colored light,
 * a nod to looking closer — at interfaces and at evidence.
 */
export function Lens({ px, py, spinning = false, className = '' }: Props) {
  return (
    <div className={`lens ${className}`} data-spin={spinning} aria-hidden="true">
      <div className="lens-aura" />
      <div className="lens-shadow" />
      {px && py ? <LiveLens px={px} py={py} /> : <LensLayers />}
    </div>
  );
}

function LiveLens({ px, py }: { px: MotionValue<number>; py: MotionValue<number> }) {
  const rotateX = useTransform(py, v => v * -9);
  const rotateY = useTransform(px, v => v * 11);
  const near = { x: useTransform(px, v => `${v * 5}%`), y: useTransform(py, v => `${v * 5}%`) };
  const mid = { x: useTransform(px, v => `${v * 3}%`), y: useTransform(py, v => `${v * 3}%`) };
  const far = { x: useTransform(px, v => `${v * 1.4}%`), y: useTransform(py, v => `${v * 1.4}%`) };
  const gx = useTransform(px, v => 38 + v * 22);
  const gy = useTransform(py, v => 30 + v * 22);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 18%, rgba(255,255,255,0) 46%)`;
  return <LensLayers tilt={{ rotateX, rotateY }} near={near} mid={mid} far={far} glare={glare} />;
}

type Offset = { x: MotionValue<string>; y: MotionValue<string> };

function LensLayers({
  tilt,
  near,
  mid,
  far,
  glare,
}: {
  tilt?: { rotateX: MotionValue<number>; rotateY: MotionValue<number> };
  near?: Offset;
  mid?: Offset;
  far?: Offset;
  glare?: MotionValue<string>;
}) {
  return (
    <motion.div className="lens-tilt" style={tilt}>
      <div className="lens-body">
        <div className="lens-swirl" />
        <div className="lens-swirl lens-swirl--counter" />
        <div className="lens-shade" />
      </div>
      <motion.div className="lens-ring lens-ring--1" style={far} />
      <motion.div className="lens-ring lens-ring--2" style={mid} />
      <motion.div className="lens-ring lens-ring--3" style={near} />
      <motion.div className="lens-reticle" style={near}>
        <span />
        <span />
        <span />
        <span />
      </motion.div>
      <motion.div className="lens-glare" style={glare ? { background: glare } : undefined} />
      <div className="lens-rim" />
    </motion.div>
  );
}
