"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";

/** Index of the lifecycle phase: 0 Discover · 1 Design · 2 Build · 3 Test · 4 Launch. */
export type PhaseIndex = number;

/* ------------------------------------------------------------------ */
/* Copilot bot                                                          */
/* ------------------------------------------------------------------ */

/**
 * Picode's AI copilot: a small robot that works on each phase with its own tool,
 * narrates what it is doing and cheers up when the phase's work is done.
 */
export function CopilotBot({ phase, tasks, local }: { phase: PhaseIndex; tasks: string[]; local: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  const [happy, setHappy] = useState(false);
  useMotionValueEvent(local, "change", (v) => {
    const i = Math.min(tasks.length - 1, Math.floor(v * tasks.length));
    setK((prev) => (prev === i ? prev : i));
    const h = v > 0.82;
    setHappy((prev) => (prev === h ? prev : h));
  });
  const flying = phase === 4;

  return (
    <div className="pointer-events-none absolute bottom-3 left-2 z-10 sm:bottom-5 sm:left-4">
      {/* speech bubble above the head */}
      <div className="absolute bottom-full left-6 mb-1 w-[11rem] sm:left-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={happy ? "done" : tasks[k]}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="relative w-max max-w-full rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[0.6875rem] font-medium leading-snug text-slate-800 shadow-[0_16px_30px_-14px_rgba(0,0,0,0.55)]"
          >
            <span className="mb-0.5 flex items-center gap-1 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-teal-700">
              <span className={happy ? "size-1.5 rounded-full bg-green-500" : "size-1.5 animate-pulse rounded-full bg-teal-500"} />
              {happy ? "Done" : "Copilot"}
            </span>
            {happy ? "All done. Handing it to the team ✓" : tasks[k]}
            {!happy && (
              <span className="ml-1 inline-flex gap-0.5 align-middle">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="size-1 rounded-full bg-slate-400"
                    animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                  />
                ))}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        className="w-[7.5rem] sm:w-[9.5rem]"
        animate={reduce ? undefined : flying ? { y: [0, -16, 0], rotate: [-2, 2, -2] } : { y: [0, -7, 0] }}
        transition={{ duration: flying ? 1.8 : 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <RobotSvg phase={phase} happy={happy} still={!!reduce} />
      </motion.div>
    </div>
  );
}

export function RobotSvg({ phase, happy, still }: { phase: PhaseIndex; happy: boolean; still: boolean }) {
  const loop = (duration: number, delay = 0) =>
    still ? { duration: 0 } : { duration, repeat: Infinity, ease: "easeInOut" as const, delay };
  const blink = still ? undefined : { scaleY: [1, 1, 0.1, 1, 1] };
  const blinkT = still ? undefined : { duration: 4, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] };

  return (
    <svg viewBox="0 0 140 170" className="w-full overflow-visible drop-shadow-[0_18px_22px_rgba(0,0,0,0.35)]" aria-hidden>
      <defs>
        <linearGradient id="bot-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe4ee" />
        </linearGradient>
        <linearGradient id="bot-visor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#14324a" />
        </linearGradient>
        <radialGradient id="bot-glow">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#5eead4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bot-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#fb923c" />
          <stop offset="1" stopColor="#fb7185" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ground shadow, or jetpack flames when launching */}
      {phase === 4 ? (
        <g>
          {[48, 72].map((x) => (
            <motion.path
              key={x}
              d={`M ${x - 7} 150 Q ${x} 182 ${x + 7} 150 Z`}
              fill="url(#bot-flame)"
              style={{ transformOrigin: `${x}px 150px` }}
              animate={still ? undefined : { scaleY: [1, 1.35, 0.9, 1.2, 1] }}
              transition={loop(0.5)}
            />
          ))}
          <rect x="40" y="132" width="16" height="20" rx="6" fill="#94a3b8" />
          <rect x="64" y="132" width="16" height="20" rx="6" fill="#94a3b8" />
        </g>
      ) : (
        <motion.ellipse
          cx="60"
          cy="166"
          rx="26"
          ry="4"
          fill="rgba(0,0,0,0.25)"
          initial={{ rx: 26, opacity: 0.5 }}
          animate={still ? undefined : { rx: [26, 21, 26], opacity: [0.5, 0.3, 0.5] }}
          transition={loop(3.2)}
        />
      )}

      {/* antenna */}
      <line x1="60" y1="20" x2="60" y2="8" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
      <motion.circle cx="60" cy="6" r="9" fill="url(#bot-glow)" animate={still ? undefined : { opacity: [0.3, 1, 0.3] }} transition={loop(happy ? 0.6 : 1.6)} />
      <circle cx="60" cy="6" r="4" fill={happy ? "#4ade80" : "#2dd4bf"} />

      {/* ears */}
      <rect x="10" y="40" width="10" height="20" rx="5" fill="#94a3b8" />
      <rect x="100" y="40" width="10" height="20" rx="5" fill="#94a3b8" />

      {/* head */}
      <rect x="16" y="18" width="88" height="62" rx="26" fill="url(#bot-shell)" stroke="#ffffff" strokeWidth="1.5" />
      <rect x="25" y="30" width="70" height="38" rx="18" fill="url(#bot-visor)" />
      <path d="M33 36 Q 46 31 60 32" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* eyes: glance at the work and blink; happy arcs when the phase is done */}
      {happy ? (
        <g stroke="#5eead4" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M39 52 Q 45 42 51 52" />
          <path d="M69 52 Q 75 42 81 52" />
        </g>
      ) : (
        <motion.g animate={still ? undefined : { x: [0, 3, 3, 0, 0] }} transition={loop(5)}>
          <motion.rect x="39" y="42" width="12" height="15" rx="6" fill="#5eead4" style={{ transformOrigin: "45px 49.5px" }} animate={blink} transition={blinkT} />
          <motion.rect x="69" y="42" width="12" height="15" rx="6" fill="#5eead4" style={{ transformOrigin: "75px 49.5px" }} animate={blink} transition={blinkT} />
        </motion.g>
      )}
      {happy && (
        <g fill="#fb7185" opacity="0.5">
          <ellipse cx="34" cy="60" rx="4" ry="2.5" />
          <ellipse cx="86" cy="60" rx="4" ry="2.5" />
        </g>
      )}

      {/* neck + body */}
      <rect x="50" y="80" width="20" height="8" rx="3" fill="#94a3b8" />
      <rect x="28" y="86" width="64" height="48" rx="20" fill="url(#bot-shell)" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="60" cy="108" r="11" fill="#0f172a" />
      <motion.circle
        cx="60"
        cy="108"
        r="6"
        fill="none"
        stroke={happy ? "#4ade80" : "#2dd4bf"}
        strokeWidth="2.5"
        strokeDasharray="28 10"
        style={{ transformOrigin: "60px 108px" }}
        animate={still ? undefined : { rotate: 360 }}
        transition={still ? undefined : { duration: 2.4, repeat: Infinity, ease: "linear" }}
      />

      {/* resting arm */}
      <rect x="14" y="94" width="14" height="30" rx="7" fill="#cbd5e1" />

      {/* working arm, raised toward the deliverable, holding this phase's tool (native SVG rotation pivots at the shoulder) */}
      <g key={`${happy}-${still}`} transform={`rotate(${happy ? -150 : -115} 98 96)`}>
        {!still && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={happy ? "-150 98 96;-165 98 96;-150 98 96" : "-108 98 96;-124 98 96;-108 98 96"}
            dur={happy ? "0.7s" : "1.8s"}
            repeatCount="indefinite"
          />
        )}
        <rect x="92" y="94" width="14" height="32" rx="7" fill="#cbd5e1" />
        <circle cx="99" cy="128" r="6" fill="#2dd4bf" />
        <g transform="translate(99 132) rotate(110) scale(1.45)">
          <Tool phase={phase} still={still} />
        </g>
      </g>
    </svg>
  );
}

/** The thing the copilot is holding: drawn around the hand at (0, 0), pointing up-right. */
function Tool({ phase, still }: { phase: PhaseIndex; still: boolean }) {
  const pulse = still ? undefined : { opacity: [0.5, 1, 0.5] };
  const pulseT = still ? undefined : { duration: 1.4, repeat: Infinity };
  switch (phase) {
    case 0: // magnifying glass
      return (
        <g>
          <line x1="0" y1="0" x2="10" y2="-10" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <circle cx="18" cy="-18" r="11" fill="rgba(167,243,208,0.35)" stroke="#e2e8f0" strokeWidth="3.5" />
          <motion.path d="M13 -23 Q 16 -26 20 -25" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" animate={pulse} transition={pulseT} />
        </g>
      );
    case 1: // stylus with a sparkle trail
      return (
        <g>
          <rect x="-2" y="-30" width="6" height="30" rx="3" fill="#38bdf8" transform="rotate(35)" />
          <path d="M -1 0 L 3 0 L 1 6 Z" fill="#0f172a" transform="rotate(35)" />
          {[
            [16, -30],
            [26, -18],
            [8, -42],
          ].map(([x, y], i) => (
            <motion.path
              key={i}
              d={`M ${x} ${y! - 4} L ${x! + 1.2} ${y! - 1.2} L ${x! + 4} ${y} L ${x! + 1.2} ${y! + 1.2} L ${x} ${y! + 4} L ${x! - 1.2} ${y! + 1.2} L ${x! - 4} ${y} L ${x! - 1.2} ${y! - 1.2} Z`}
              fill="#fde68a"
              animate={still ? undefined : { scale: [0.4, 1.1, 0.4], opacity: [0, 1, 0] }}
              style={{ transformOrigin: `${x}px ${y}px` }}
              transition={still ? undefined : { duration: 1.4, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </g>
      );
    case 2: // holographic code
      return (
        <motion.g animate={pulse} transition={pulseT}>
          <rect x="4" y="-36" width="38" height="24" rx="5" fill="rgba(94,234,212,0.18)" stroke="#5eead4" strokeWidth="1.5" />
          <text x="23" y="-19" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="700" fill="#5eead4">
            {"</>"}
          </text>
          <path d="M 0 0 L 4 -12 M 0 0 L 12 -12" stroke="rgba(94,234,212,0.45)" strokeWidth="1" />
        </motion.g>
      );
    case 3: // shield with a tick
      return (
        <g>
          <path d="M 18 -40 L 34 -34 L 34 -20 Q 34 -8 18 -2 Q 2 -8 2 -20 L 2 -34 Z" fill="#22c55e" stroke="white" strokeWidth="2" />
          <path d="M 11 -21 L 16 -15 L 26 -27" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <motion.path
            d="M 18 -40 L 34 -34 L 34 -20 Q 34 -8 18 -2 Q 2 -8 2 -20 L 2 -34 Z"
            fill="none"
            stroke="#86efac"
            strokeWidth="2"
            animate={still ? undefined : { scale: [1, 1.35], opacity: [0.8, 0] }}
            style={{ transformOrigin: "18px -21px" }}
            transition={still ? undefined : { duration: 1.4, repeat: Infinity }}
          />
        </g>
      );
    default: // waving a little flag
      return (
        <g>
          <line x1="0" y1="0" x2="0" y2="-36" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <motion.path
            d="M 0 -36 Q 10 -40 22 -34 Q 12 -30 22 -24 Q 10 -28 0 -24 Z"
            fill="#2dd4bf"
            animate={still ? undefined : { skewY: [0, -8, 0] }}
            transition={still ? undefined : { duration: 0.8, repeat: Infinity }}
          />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Stage effects                                                        */
/* ------------------------------------------------------------------ */

/** Background of the deliverable stage per phase: all within the brand's teal/sky range. */
export const STAGE_BG = [
  "radial-gradient(120% 90% at 85% 0%, #34d3bd, #0d9488 45%, #0a3a3f)", // discover
  "radial-gradient(120% 90% at 85% 0%, #5cc8f5, #0e8fb3 45%, #0b2f48)", // design
  "radial-gradient(120% 90% at 85% 0%, #2bb3a3, #0b4f5c 50%, #071a2a)", // build
  "radial-gradient(120% 90% at 85% 0%, #4ade80, #0d9488 45%, #0a3a33)", // test
  "radial-gradient(120% 90% at 85% 0%, #7dd3fc, #0ea5e9 35%, #0d9488 70%, #0a3a3f)", // launch
];

/** A scanner beam sweeping top to bottom across the deliverable. */
export function ScanBeam() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-[-6%] z-20 h-12"
      initial={{ top: "-10%" }}
      animate={{ top: ["-10%", "100%"] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
    >
      <div className="h-full bg-gradient-to-b from-transparent via-green-300/25 to-transparent" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-green-300 shadow-[0_0_12px_2px_rgba(134,239,172,0.8)]" />
    </motion.div>
  );
}

/** Sparks drifting up the stage after a launch. */
export function RisingSparks() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 size-1.5 rounded-full"
          style={{ left: `${(i * 37) % 100}%`, background: i % 3 ? "#a7f3d0" : "#fde68a" }}
          animate={{ y: [0, -420], opacity: [0, 1, 0] }}
          transition={{ duration: 3 + (i % 4) * 0.6, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Neural network backdrop                                              */
/* ------------------------------------------------------------------ */

const NODES: [number, number][] = [
  [8, 22], [22, 10], [30, 34], [14, 58], [38, 64], [52, 18], [62, 44], [74, 12], [86, 36], [92, 66], [70, 78], [46, 88], [20, 86],
];
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 5], [2, 4], [2, 3], [3, 12], [4, 11], [4, 6], [5, 6], [5, 7], [6, 8], [7, 8], [8, 9], [9, 10], [6, 10], [10, 11], [11, 12],
];

/** Faint, slowly pulsing neural network with data packets travelling along a few links. */
export function NeuralBackdrop() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-10 size-full" aria-hidden>
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a]![0]}
          y1={NODES[a]![1]}
          x2={NODES[b]![0]}
          y2={NODES[b]![1]}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.25"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {!reduce &&
        EDGES.filter((_, i) => i % 3 === 0).map(([a, b], i) => (
          <motion.circle
            key={`p${i}`}
            r="0.7"
            fill="#a7f3d0"
            initial={{ cx: NODES[a]![0], cy: NODES[a]![1], opacity: 0 }}
            animate={{ cx: [NODES[a]![0], NODES[b]![0]], cy: [NODES[a]![1], NODES[b]![1]], opacity: [0, 1, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }}
          />
        ))}
      {NODES.map(([x, y], i) => (
        <motion.circle
          key={`n${i}`}
          cx={x}
          cy={y}
          r="0.6"
          fill="rgba(255,255,255,0.5)"
          animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 3, repeat: Infinity, delay: (i % 5) * 0.5 }}
        />
      ))}
    </svg>
  );
}
