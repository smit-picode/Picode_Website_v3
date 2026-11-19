"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/** Hero copy drifts up, fades and softly blurs as you scroll away. */
export function HeroCopyScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 30%", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const filter = useTransform(scrollYProgress, [0.2, 0.9], ["blur(0px)", "blur(6px)"]);
  return (
    <motion.div ref={ref} style={reduce ? undefined : { y, opacity, filter }} className={className}>
      {children}
    </motion.div>
  );
}

/** The studio window tips back in 3D and recedes as the hero scrolls out. */
export function StudioScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 25%", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.3 });
  const rotateX = useTransform(p, [0, 1], [0, 28]);
  const scale = useTransform(p, [0, 1], [1, 0.86]);
  const y = useTransform(p, [0, 1], [0, 80]);
  const opacity = useTransform(p, [0.4, 1], [1, 0.2]);
  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { rotateX, scale, y, opacity, transformPerspective: 1400, transformOrigin: "50% 100%" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Hand-drawn underline that sketches itself under a word. */
export function Scribble({ className, delay = 0.9 }: { className?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 300 24" fill="none" preserveAspectRatio="none" aria-hidden className={className}>
      <defs>
        <linearGradient id="scribble" x1="0" x2="1">
          <stop offset="0" stopColor="rgb(45 212 191)" />
          <stop offset="1" stopColor="rgb(56 189 248)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M4 16 C 60 6, 120 4, 180 9 S 270 16, 296 7"
        stroke="url(#scribble)"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay, duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}
