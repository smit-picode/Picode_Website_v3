"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

/**
 * Floating "pearl" spheres with a pencil-sketch print that slowly rolls across
 * their surface. They bob gently, drift with the mouse (deeper ones less),
 * parallax on scroll, and can be grabbed and flung; they spring back home.
 * Pure CSS + SVG (no WebGL), decorative only (aria-hidden).
 */

type SphereSpec = {
  size: number; // px
  pos: React.CSSProperties; // absolute placement inside the hero
  depth: number; // 0..1, how strongly it follows mouse/scroll
  art: ReactNode;
  roll: number; // seconds per full roll of the print
  bob: number; // seconds per float cycle
  delay: number;
};

const INK = "rgb(31 41 55)";

/* ---------------- Sketch prints (drawn twice, offset, for a hand-drawn line) ---------------- */
function Sketch({ children, viewBox = "0 0 120 120" }: { children: ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className="size-full" fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
      <g strokeWidth={3}>{children}</g>
      <g strokeWidth={1.2} opacity={0.45} transform="translate(1.6 -1.1) rotate(0.8 60 60)">
        {children}
      </g>
    </svg>
  );
}

const PICODE_MARK =
  "M63.9 0 63.8.06C62.6.6 38.2 9.1 38.2 9.1L12.6.05 12.5 0 .3 11.7c0 0 8.8 19.5 8.8 26.4v.7L2.3 58.8.3 65.3l12.3 11.7 12.3-11.7-2.1-6.5-6.7-19.9v-.7c0-5.4 4.1-14.4 5.9-18.2l16.3-4.6c.1 0 10.3 1.9 16 3.9 1.6 3.2 6.2 13.1 6.2 18.9v.7l-6.7 19.9-2.1 6.5 12.3 11.7 12.3-11.7-2.1-6.5-6.7-19.9v-.7c0-7 8.8-26.4 8.8-26.4L63.9 0Z";

const LogoArt = (
  <Sketch viewBox="-16 -22 140 122">
    <path d={PICODE_MARK} />
    <path d="M94.4 51.5 81 64.3l13.4 12.7 13.3-12.7-13.3-12.8Z" />
    {/* little sketch flourishes */}
    <path d="M-6 88c18 6 44 7 66 2" opacity={0.5} />
    <path d="M100 30l4-4M104 36h6M98 22l1-6" opacity={0.6} />
  </Sketch>
);

const RobotArt = (
  <Sketch>
    <path d="M60 18v12" />
    <circle cx="60" cy="15" r="4" />
    <rect x="30" y="30" width="60" height="48" rx="14" />
    <circle cx="47" cy="52" r="6" />
    <circle cx="73" cy="52" r="6" />
    <path d="M47 66c8 5 18 5 26 0" />
    <path d="M24 48v14M96 48v14" />
    <path d="M42 78v10h36V78" />
    <path d="M36 98c8-4 40-4 48 0" opacity={0.5} />
  </Sketch>
);

const CodeArt = (
  <Sketch>
    <path d="M42 38 20 60l22 22" />
    <path d="M78 38l22 22-22 22" />
    <path d="M68 30 52 90" />
    <path d="M30 100h18" opacity={0.6} />
    <path d="M88 22l3-6M95 27l6-2" opacity={0.6} />
  </Sketch>
);

const SparkArt = (
  <Sketch>
    <path d="M60 22c3 20 8 30 30 38-22 8-27 18-30 38-3-20-8-30-30-38 22-8 27-18 30-38Z" />
    <path d="M92 26c1 6 3 9 9 11-6 2-8 5-9 11-1-6-3-9-9-11 6-2 8-5 9-11Z" />
    <circle cx="30" cy="92" r="3" />
  </Sketch>
);

const SPHERES: SphereSpec[] = [
  { size: 230, pos: { right: "1%", top: "-6%" }, depth: 0.9, art: LogoArt, roll: 26, bob: 6.5, delay: 0 },
  { size: 140, pos: { left: "58%", top: "6%" }, depth: 0.55, art: RobotArt, roll: 18, bob: 5.2, delay: 0.25 },
  { size: 104, pos: { right: "24%", top: "52%" }, depth: 0.35, art: CodeArt, roll: 14, bob: 4.6, delay: 0.45 },
  { size: 70, pos: { right: "4%", top: "74%" }, depth: 0.2, art: SparkArt, roll: 11, bob: 4, delay: 0.6 },
];

/** Same breakpoint as the `xl:block` below: narrower screens would put the spheres over the hero text. */
const SHOW_QUERY = "(min-width: 1280px)";

export function FloatingSpheres() {
  // Mount the spheres only while the screen is wide enough. If they mounted while hidden
  // (display: none), their drag constraints would be measured as 0×0 and, after resizing
  // to a big screen, every sphere would be squeezed into the same spot.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(SHOW_QUERY);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide ? <SphereField /> : null;
}

function SphereField() {
  const reduce = useReducedMotion();
  const areaRef = useRef<HTMLDivElement>(null);

  // Pointer position normalised to -1..1 around the viewport centre.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 50, damping: 16 });
  const sy = useSpring(py, { stiffness: 50, damping: 16 });
  const { scrollY } = useScroll();

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduce]);

  return (
    <div ref={areaRef} aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
      {SPHERES.map((s, i) => (
        <Sphere key={i} spec={s} area={areaRef} sx={sx} sy={sy} scrollY={scrollY} reduce={!!reduce} />
      ))}
    </div>
  );
}

function Sphere({
  spec,
  area,
  sx,
  sy,
  scrollY,
  reduce,
}: {
  spec: SphereSpec;
  area: React.RefObject<HTMLDivElement>;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  scrollY: MotionValue<number>;
  reduce: boolean;
}) {
  const { size, depth } = spec;
  // Mouse drift + scroll parallax (deeper spheres move more).
  const x = useTransform(sx, (v) => v * 26 * depth);
  const mouseY = useTransform(sy, (v) => v * 18 * depth);
  const y = useTransform([mouseY, scrollY] as MotionValue<number>[], ([m, s]) => (m as number) - (s as number) * 0.18 * depth);

  return (
    <motion.div className="absolute" style={{ ...spec.pos, width: size, height: size, x: reduce ? 0 : x, y: reduce ? 0 : y }}>
      {/* entrance */}
      <motion.div
        className="relative size-full"
        initial={reduce ? false : { opacity: 0, scale: 0.6, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3 + spec.delay, type: "spring", stiffness: 120, damping: 14 }}
      >
        {/* draggable + floating ball (its shadow travels with it) */}
        <motion.div
          drag={!reduce}
          dragConstraints={area}
          dragElastic={0.35}
          dragSnapToOrigin
          dragTransition={{ bounceStiffness: 180, bounceDamping: 12 }}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          className="pointer-events-auto absolute inset-0 cursor-grab touch-none"
        >
        {/* soft floor shadow: shrinks/fades as the sphere rises */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: size * 0.95,
            height: size * 0.95,
            left: size * 0.22,
            top: size * 0.3,
            background: "radial-gradient(circle at 45% 45%, rgb(15 23 42 / 0.22), rgb(15 23 42 / 0.08) 45%, transparent 70%)",
            filter: `blur(${Math.round(size * 0.06)}px)`,
          }}
          animate={reduce ? undefined : { scale: [1, 0.9, 1], opacity: [0.9, 0.65, 0.9] }}
          transition={{ duration: spec.bob, repeat: Infinity, ease: "easeInOut", delay: spec.delay }}
        />

          <motion.div
            className="relative size-full"
            animate={reduce ? undefined : { y: [0, -size * 0.07, 0], rotate: [0, 3, 0] }}
            transition={{ duration: spec.bob, repeat: Infinity, ease: "easeInOut", delay: spec.delay }}
          >
            <Ball size={size} roll={spec.roll} reduce={reduce}>
              {spec.art}
            </Ball>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Ball({ size, roll, reduce, children }: { size: number; roll: number; reduce: boolean; children: ReactNode }) {
  return (
    <div
      className="relative size-full overflow-hidden rounded-full"
      style={{
        background: "radial-gradient(circle at 32% 26%, #ffffff 0%, #f7f8fa 30%, #e3e6ea 62%, #c4c9d1 88%, #b3b9c2 100%)",
        boxShadow: `inset ${-size * 0.06}px ${-size * 0.08}px ${size * 0.18}px rgb(15 23 42 / 0.16), 0 ${size * 0.02}px ${size * 0.05}px rgb(15 23 42 / 0.08)`,
      }}
    >
      {/* The print: two copies side by side slide left forever = the ball "rolls".
          A radial mask fades it toward the rim so it reads as wrapped on a curve. */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(circle at 45% 42%, black 38%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 45% 42%, black 38%, transparent 70%)",
        }}
      >
        <motion.div
          className="absolute left-0 top-0 flex"
          style={{ width: size * 2, height: size }}
          animate={reduce ? undefined : { x: [0, -size] }}
          transition={{ duration: roll, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
              <div style={{ width: size * 0.66, height: size * 0.66 }}>{children}</div>
            </div>
          ))}
        </motion.div>
      </div>
      {/* specular highlight + rim light on top of the print */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, rgb(255 255 255 / 0.95) 0%, rgb(255 255 255 / 0.35) 14%, transparent 32%), radial-gradient(circle at 70% 85%, rgb(var(--color-primary) / 0.18), transparent 45%)",
        }}
      />
      {/* fine paper grain */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-[0.18] mix-blend-multiply"
        style={{ backgroundImage: "radial-gradient(rgb(0 0 0 / 0.35) 0.5px, transparent 0.6px)", backgroundSize: "3px 3px" }}
      />
    </div>
  );
}
