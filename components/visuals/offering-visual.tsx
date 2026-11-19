"use client";

/**
 * Animated 2D illustrations, one per offering. Pure SVG + Framer Motion, so they
 * stay crisp at any size, theme via CSS variables, and cost no WebGL context.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { OfferingVisual } from "@/lib/content/offerings";
import { cn } from "@/lib/utils";

const P = "rgb(var(--color-primary))";
const S = "rgb(var(--color-secondary))";
const T = "rgb(var(--color-tertiary))";
const LINE = "rgb(var(--gray-300))";
const PANEL = "rgb(var(--color-surface-raised))";

export function OfferingVisualArt({ kind, className }: { kind: OfferingVisual; className?: string }) {
  return (
    <div className={cn("relative aspect-[4/3] w-full", className)}>
      {kind === "agents" && <Agents />}
      {kind === "devices" && <Devices />}
      {kind === "pipeline" && <Pipeline />}
      {kind === "dashboard" && <Dashboard />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 01 — Legacy blocks transform into an agent-orchestrated system      */
/* ------------------------------------------------------------------ */
function Agents() {
  const reduce = useReducedMotion();
  const agents = [
    { x: 300, y: 70, label: "Agent · Intake", c: P },
    { x: 330, y: 160, label: "Agent · Rules", c: S },
    { x: 300, y: 250, label: "Agent · Approve", c: T },
  ];
  return (
    <svg viewBox="0 0 400 300" className="size-full overflow-visible">
      <defs>
        <linearGradient id="ag-g" x1="0" x2="1">
          <stop offset="0" stopColor={P} />
          <stop offset="1" stopColor={T} />
        </linearGradient>
        <radialGradient id="ag-core">
          <stop offset="0" stopColor={S} stopOpacity="0.9" />
          <stop offset="1" stopColor={S} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Legacy stack on the left */}
      {[0, 1, 2, 3].map((i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <rect x="20" y={70 + i * 42} width="90" height="32" rx="6" fill={PANEL} stroke={LINE} />
          <rect x="30" y={82 + i * 42} width={40 + (i % 2) * 20} height="4" rx="2" fill={LINE} />
          <rect x="30" y={90 + i * 42} width="30" height="4" rx="2" fill={LINE} opacity="0.6" />
        </motion.g>
      ))}
      <text x="65" y="56" textAnchor="middle" className="fill-gray-400 font-mono text-[9px] uppercase tracking-widest">
        Legacy
      </text>

      {/* Core */}
      <circle cx="200" cy="160" r="60" fill="url(#ag-core)" opacity="0.35" />
      <motion.circle
        cx="200" cy="160" r="34" fill="none" stroke="url(#ag-g)" strokeWidth="1.5" strokeDasharray="4 6"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "200px 160px" }}
      />
      <circle cx="200" cy="160" r="22" fill={PANEL} stroke="url(#ag-g)" strokeWidth="2" />
      <text x="200" y="164" textAnchor="middle" className="fill-gray-900 font-mono text-[10px] font-semibold">AI</text>

      {/* Legacy → core flow */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M110 ${86 + i * 42} C150 ${86 + i * 42} 150 160 178 160`} fill="none" stroke={LINE} strokeWidth="1" />
          {!reduce && (
            <motion.circle
              r="2.5" fill={P}
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: "100%" }}
              transition={{ duration: 2.2, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ offsetPath: `path("M110 ${86 + i * 42} C150 ${86 + i * 42} 150 160 178 160")` }}
            />
          )}
        </g>
      ))}

      {/* Agents */}
      {agents.map((a, i) => (
        <g key={a.label}>
          <path d={`M222 160 C260 160 260 ${a.y} ${a.x - 8} ${a.y}`} fill="none" stroke={a.c} strokeOpacity="0.5" strokeWidth="1.2" />
          {!reduce && (
            <motion.circle
              r="3" fill={a.c}
              animate={{ offsetDistance: ["0%", "100%"] }}
              transition={{ duration: 1.8, delay: 0.6 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ offsetPath: `path("M222 160 C260 160 260 ${a.y} ${a.x - 8} ${a.y}")` }}
            />
          )}
          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 200 }}
            style={{ transformOrigin: `${a.x}px ${a.y}px` }}
          >
            <circle cx={a.x} cy={a.y} r="9" fill={PANEL} stroke={a.c} strokeWidth="2" />
            <motion.circle
              cx={a.x} cy={a.y} r="9" fill="none" stroke={a.c}
              animate={reduce ? undefined : { scale: [1, 2], opacity: [0.6, 0] }}
              transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
              style={{ transformOrigin: `${a.x}px ${a.y}px`, transformBox: "view-box" }}
            />
            <text x={a.x + 16} y={a.y + 3} className="fill-gray-600 font-mono text-[8.5px]">{a.label}</text>
          </motion.g>
        </g>
      ))}

      {/* Human approval */}
      <g>
        <rect x="150" y="248" width="100" height="26" rx="13" fill={PANEL} stroke={LINE} />
        <motion.circle cx="166" cy="261" r="5" fill="rgb(var(--color-success))"
          animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        <text x="178" y="264" className="fill-gray-600 font-mono text-[8.5px]">Human approval</text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 02 — Browser + phone with live, building UI                         */
/* ------------------------------------------------------------------ */
function Devices() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0">
      {/* Browser */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 12 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="absolute left-0 top-[6%] w-[78%] overflow-hidden rounded-xl border border-gray-200 bg-surface-raised shadow-float"
        style={{ transformPerspective: 900 }}
      >
        <div className="flex items-center gap-1.5 border-b border-gray-200 px-3 py-2">
          {["bg-danger/70", "bg-warning/70", "bg-success/70"].map((c) => (
            <span key={c} className={cn("size-2 rounded-full", c)} />
          ))}
          <span className="ml-3 h-3 flex-1 rounded-full bg-gray-100" />
        </div>
        <div className="grid grid-cols-5 gap-2 p-3">
          <div className="col-span-1 space-y-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={cn("h-2 rounded-full", i === 1 ? "bg-primary/60" : "bg-gray-100")} />
            ))}
          </div>
          <div className="col-span-4 space-y-2">
            <motion.div
              className="h-14 rounded-lg bg-gradient-to-r from-primary/30 via-secondary/30 to-tertiary/30"
              animate={reduce ? undefined : { backgroundPosition: ["0% 50%", "100% 50%"] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              style={{ backgroundSize: "200% 100%" }}
            />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-10 rounded-md border border-gray-200 bg-surface"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                />
              ))}
            </div>
            <div className="h-2 w-2/3 rounded-full bg-gray-100" />
          </div>
        </div>
      </motion.div>

      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="absolute bottom-[2%] right-[2%] w-[32%]"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="aspect-[9/18] rounded-[1.4rem] border-[3px] border-gray-800 bg-surface-raised p-2 shadow-float dark:border-gray-300"
        >
          <div className="mx-auto mb-2 h-1.5 w-8 rounded-full bg-gray-200" />
          <div className="h-[30%] rounded-lg bg-gradient-to-br from-secondary/50 to-tertiary/40" />
          <div className="mt-2 space-y-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="flex items-center gap-1.5 rounded-md bg-gray-50 p-1.5"
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + i * 0.15 }}
              >
                <span className="size-3 rounded-full bg-primary/60" />
                <span className="h-1.5 flex-1 rounded-full bg-gray-200" />
              </motion.div>
            ))}
          </div>
          <div className="mt-2 h-5 rounded-full bg-gradient-primary" />
        </motion.div>
      </motion.div>

      {/* Floating chips */}
      {[
        { t: "iOS", c: "left-[6%] bottom-[12%]" },
        { t: "Android", c: "left-[26%] bottom-[4%]" },
        { t: "Web", c: "left-[46%] bottom-[14%]" },
      ].map((chip, i) => (
        <motion.span
          key={chip.t}
          className={cn("absolute rounded-full border border-gray-200 bg-surface/90 px-2.5 py-1 font-mono text-[0.625rem] text-gray-600 shadow-soft backdrop-blur", chip.c)}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          {chip.t}
        </motion.span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 03 — Documents flow through AI extraction → rules → approval        */
/* ------------------------------------------------------------------ */
function Pipeline() {
  const reduce = useReducedMotion();
  const stages = [
    { x: 40, label: "Intake", icon: "📄" },
    { x: 140, label: "AI extract", icon: "✦" },
    { x: 240, label: "Rules", icon: "⇄" },
    { x: 340, label: "Approve", icon: "✓" },
  ];
  const path = "M40 150 L340 150";
  return (
    <svg viewBox="0 0 400 300" className="size-full overflow-visible">
      <defs>
        <linearGradient id="pl-g" x1="0" x2="1">
          <stop offset="0" stopColor={P} />
          <stop offset="0.5" stopColor={S} />
          <stop offset="1" stopColor={T} />
        </linearGradient>
      </defs>
      <path d={path} stroke={LINE} strokeWidth="2" strokeDasharray="3 5" />
      <motion.path
        d={path} stroke="url(#pl-g)" strokeWidth="3" fill="none" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      {stages.map((s, i) => (
        <motion.g
          key={s.label}
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.25 }}
        >
          <rect x={s.x - 26} y="124" width="52" height="52" rx="14" fill={PANEL} stroke="url(#pl-g)" strokeWidth="1.5" />
          <text x={s.x} y="157" textAnchor="middle" className="fill-gray-900 text-[18px]">{s.icon}</text>
          <text x={s.x} y="198" textAnchor="middle" className="fill-gray-500 font-mono text-[9px] uppercase tracking-wider">{s.label}</text>
        </motion.g>
      ))}
      {/* Tokens moving through */}
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.g
            key={i}
            animate={{ x: [0, 300], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4, delay: i * 1.33, repeat: Infinity, ease: "easeInOut", times: [0, 0.1, 0.9, 1] }}
          >
            <rect x="30" y="96" width="20" height="14" rx="3" fill={S} opacity="0.9" />
            <line x1="40" y1="110" x2="40" y2="124" stroke={S} strokeOpacity="0.5" />
          </motion.g>
        ))}
      {/* Branch: escalation */}
      <motion.g
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ delay: 1.4, duration: 0.5 }}
      >
        {/* Starts below the "Rules" label and lands on the pill's left edge */}
        <motion.path
          d="M240 207 C240 236 250 250 270 250"
          stroke={T} strokeOpacity="0.7" strokeWidth="1.5" fill="none" strokeDasharray="3 4" strokeLinecap="round"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ delay: 1.5, duration: 0.6, ease: "easeOut" }}
        />
        <circle cx="240" cy="207" r="2" fill={T} />
        <rect x="270" y="237" width="122" height="26" rx="13" fill={PANEL} stroke={T} strokeOpacity="0.45" />
        {/* Status dot */}
        {!reduce && (
          <motion.circle
            cx="284" cy="250" r="3" fill={T}
            animate={{ r: [3, 6.5], opacity: [0.45, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <circle cx="284" cy="250" r="3" fill={T} />
        <text x="294" y="253" className="font-mono text-[8.5px]">
          <tspan className="fill-gray-700">Escalate</tspan>
          <tspan className="fill-gray-400"> · </tspan>
          <tspan fill={T} fontWeight="600">SLA 4h</tspan>
        </text>
      </motion.g>
      {/* Metrics */}
      <g>
        <rect x="14" y="30" width="120" height="44" rx="10" fill={PANEL} stroke={LINE} />
        <text x="26" y="48" className="fill-gray-400 font-mono text-[8px] uppercase tracking-wider">Cycle time</text>
        <text x="26" y="66" className="fill-gray-900 font-display text-[15px] font-semibold">−62%</text>
        <rect x="264" y="30" width="120" height="44" rx="10" fill={PANEL} stroke={LINE} />
        <text x="276" y="48" className="fill-gray-400 font-mono text-[8px] uppercase tracking-wider">Auto-routed</text>
        <text x="276" y="66" className="fill-gray-900 font-display text-[15px] font-semibold">87%</text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 04 — Live dashboard: bars, trend line and a counter                 */
/* ------------------------------------------------------------------ */
function useTicker(active: boolean) {
  const [v, setV] = useState(1284);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setV((x) => x + Math.round(Math.random() * 9)), 1200);
    return () => window.clearInterval(id);
  }, [active]);
  return v;
}

function Dashboard() {
  const reduce = useReducedMotion();
  const value = useTicker(!reduce);
  const bars = [42, 68, 55, 80, 62, 95, 74, 88];
  // Kept below y≈105 so it never runs into the KPI / donut header row.
  const line = "M20 232 C60 216 90 224 120 198 S180 180 210 164 S270 148 300 132 S350 118 380 110";
  return (
    <svg viewBox="0 0 400 300" className="size-full overflow-visible">
      <defs>
        <linearGradient id="db-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={P} stopOpacity="0.25" />
          <stop offset="1" stopColor={S} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="db-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T} stopOpacity="0.35" />
          <stop offset="1" stopColor={T} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="392" height="292" rx="16" fill={PANEL} stroke={LINE} />
      {/* KPI */}
      <text x="22" y="34" className="fill-gray-400 font-mono text-[8.5px] uppercase tracking-widest">Live orders</text>
      <text x="22" y="60" className="fill-gray-900 font-display text-[24px] font-semibold tabular-nums">{value.toLocaleString("en-US")}</text>
      <circle cx="150" cy="30" r="3.5" fill="rgb(var(--color-success))">
        {!reduce && <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />}
      </circle>
      <text x="158" y="33" className="fill-success font-mono text-[8.5px]">LIVE</text>
      {/* Donut */}
      <g transform="translate(340 46)">
        <circle r="24" fill="none" stroke={LINE} strokeWidth="6" />
        <motion.circle
          r="24" fill="none" stroke={P} strokeWidth="6" strokeLinecap="round" transform="rotate(-90)"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 0.72 }} viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <text y="4" textAnchor="middle" className="fill-gray-900 font-mono text-[10px] font-semibold">72%</text>
      </g>
      {/* Grid */}
      {[110, 160, 210, 260].map((y) => (
        <line key={y} x1="20" x2="380" y1={y} y2={y} stroke={LINE} strokeOpacity="0.5" strokeDasharray="2 4" />
      ))}
      {/* Bars */}
      {bars.map((h, i) => (
        <motion.rect
          key={i}
          x={30 + i * 44} width="22" rx="4" fill="url(#db-bar)"
          initial={{ height: 0, y: 270 }}
          whileInView={{ height: h * 1.25, y: 270 - h * 1.25 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 * i, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      {/* Trend */}
      <motion.path d={`${line} L380 270 L20 270 Z`} fill="url(#db-area)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1 }} />
      <motion.path
        d={line} fill="none" stroke={T} strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.8, delay: 0.4, ease: "easeInOut" }}
      />
      {!reduce && (
        <motion.circle
          r="5" fill={T} stroke="white" strokeWidth="2"
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path("${line}")` }}
        />
      )}
      {/* AI insight: sits in the header row (under LIVE), clear of the chart */}
      <motion.g
        initial={{ opacity: 0, y: 4 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 1.6, duration: 0.5 }}
      >
        <g transform="translate(146 44)">
          <rect width="150" height="24" rx="12" fill={PANEL} />
          <rect width="150" height="24" rx="12" fill="rgb(var(--color-tertiary) / 0.12)" stroke={T} strokeOpacity="0.4" />
          <text x="75" y="15.5" textAnchor="middle" className="fill-tertiary font-mono text-[8.5px]">✦ AI: demand +18% Friday</text>
        </g>
      </motion.g>
    </svg>
  );
}
