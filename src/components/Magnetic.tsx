import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useFinePointer } from '../lib/hooks';

/** Leans its child toward a nearby pointer. Off for touch and reduced motion. */
export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.5 });

  return (
    <motion.span
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-flex' }}
      onPointerMove={event => {
        if (!enabled || !ref.current) return;
        const box = ref.current.getBoundingClientRect();
        x.set((event.clientX - (box.left + box.width / 2)) * strength);
        y.set((event.clientY - (box.top + box.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
