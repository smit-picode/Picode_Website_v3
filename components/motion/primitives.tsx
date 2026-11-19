"use client";

/**
 * Client-side Framer Motion building blocks.
 * Sections stay React Server Components; only these leaves ship JS.
 */
import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Fade-up with a subtle 3D flip (rotateX) out of the screen plane. */
export const fadeUp3d: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: 22, transformPerspective: 1100 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transformPerspective: 1100,
    transition: { duration: 0.9, ease: EASE_OUT },
  },
};

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  /** Degrees of rotateX to flip in from (0 disables the 3D effect). */
  tilt?: number;
};

/** Fades + flips an element up into place once when it scrolls into view. */
export function Reveal({ delay = 0, y = 40, tilt = 16, children, style, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, rotateX: tilt }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
      style={{ transformPerspective: 1100, transformOrigin: "50% 100%", ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = HTMLMotionProps<"div"> & {
  stagger?: number;
  delayChildren?: number;
  trigger?: "view" | "mount";
};

/** Parent that staggers its <StaggerItem> children. */
export function Stagger({
  stagger = 0.12,
  delayChildren = 0,
  trigger = "view",
  children,
  ...props
}: StaggerProps) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
  const triggerProps =
    trigger === "mount"
      ? { animate: "show" as const }
      : { whileInView: "show" as const, viewport: { once: true, margin: "-80px" } };

  return (
    <motion.div variants={variants} initial="hidden" {...triggerProps} {...props}>
      {children}
    </motion.div>
  );
}

type StaggerItemProps = HTMLMotionProps<"div"> & {
  as?: "div" | "span" | "li";
};

export function StaggerItem({ as = "div", children, style, ...props }: StaggerItemProps) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component variants={fadeUp3d} style={{ transformOrigin: "50% 100%", ...style }} {...props}>
      {children}
    </Component>
  );
}

type FloatProps = HTMLMotionProps<"div"> & {
  distance?: number;
  duration?: number;
  delay?: number;
};

/** Slow, infinite floating (y: [0, -10, 0]) for decorative graphics. */
export function Float({ distance = 10, duration = 4, delay = 0, children, ...props }: FloatProps) {
  return (
    <motion.div
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type TiltProps = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  max?: number;
  /** Show a soft light glare that follows the cursor. */
  glare?: boolean;
};

/** Mouse-tracking 3D tilt. Children can use `translateZ` (via style) for depth layers. */
export function Tilt({ children, className, max = 10, glare = false }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18, mass: 0.4 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.35), transparent 55%)`;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType === "touch") return;
    const r = ref.current!.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d" }}
      className={cn("relative", className)}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          style={{ background: glareBg }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </motion.div>
  );
}

type ScrollSceneProps = {
  children: ReactNode;
  className?: string;
  /** Starting rotateX in degrees as the block enters from below. */
  fromRotate?: number;
  fromScale?: number;
};

/**
 * Scroll-linked 3D entrance: the block starts tilted back and scaled down,
 * then rights itself as it scrolls into the viewport (scrubbed, not one-shot).
 */
export function ScrollScene({ children, className, fromRotate = 18, fromScale = 0.9 }: ScrollSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 35%"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const rotateX = useTransform(p, [0, 1], [fromRotate, 0]);
  const scale = useTransform(p, [0, 1], [fromScale, 1]);
  const opacity = useTransform(p, [0, 0.5, 1], [0.2, 0.85, 1]);

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { rotateX, scale, opacity, transformPerspective: 1400, transformOrigin: "50% 0%" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Vertical parallax: moves children at a different speed than the page. */
export function Parallax({
  children,
  className,
  offset = 80,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}
