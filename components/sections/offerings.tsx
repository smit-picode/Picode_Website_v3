"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  Cloud,
  Database,
  Mail,
  MousePointer2,
  PenTool,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Tilt } from "@/components/motion/primitives";
import { ScrollHint, useAutoplay, useWheelSteps } from "@/components/motion/autoplay";
import { useScrollActiveIntoView } from "@/components/motion/use-scroll-active-into-view";
import { Container, Eyebrow } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type Offering = {
  icon: LucideIcon;
  /** Completes "…apps that will ___". */
  will: string;
  title: string;
  description: string;
  points: string[];
  Scene: () => JSX.Element;
};

/* ------------------------------------------------------------------ */
/* Scenes — one small, looping illustration per offering                */
/* ------------------------------------------------------------------ */

function SceneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative h-56 overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-surface sm:h-64 lg:h-[clamp(11rem,28vh,16rem)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-faint bg-[size:22px_22px] opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      {children}
    </div>
  );
}

/** Legacy box gets an AI brain with agents orbiting it. */
function ModernizeScene() {
  const agents = ["Approve", "Route", "Predict"];
  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center justify-between px-6 sm:px-10">
        {/* Legacy system */}
        <div className="relative w-28 rounded-xl border border-gray-300 bg-gray-100 p-2.5 font-mono text-[0.625rem] text-gray-500 shadow-soft sm:w-32">
          <p className="mb-1.5 flex items-center justify-between">
            <span>legacy.exe</span>
            <span className="text-[0.5rem]">2009</span>
          </p>
          {[80, 60, 72, 48].map((w, i) => (
            <span key={i} className="mb-1 block h-1.5 rounded-sm bg-gray-300" style={{ width: `${w}%` }} />
          ))}
          <span className="absolute -right-2 -top-2 rounded-full bg-success px-1.5 py-0.5 text-[0.5rem] font-semibold text-white">
            kept
          </span>
        </div>

        {/* Beam */}
        <div className="relative mx-3 h-px flex-1 bg-gradient-to-r from-gray-300 to-primary/60">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute -top-1 size-2 rounded-full bg-primary shadow-glow"
              animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* AI core with orbiting agents */}
        <div className="relative flex size-36 items-center justify-center sm:size-40">
          <motion.span
            aria-hidden
            className="absolute inset-4 rounded-full border border-dashed border-primary/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <BrainCircuit className="size-7" strokeWidth={1.75} aria-hidden />
          </motion.span>
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          >
            {agents.map((a, i) => {
              const angle = (i / agents.length) * Math.PI * 2;
              return (
                <motion.span
                  key={a}
                  className="absolute rounded-full border border-primary/30 bg-surface px-2 py-0.5 text-[0.625rem] font-semibold text-primary-strong shadow-soft"
                  style={{
                    left: `${50 + Math.cos(angle) * 46}%`,
                    top: `${50 + Math.sin(angle) * 46}%`,
                    x: "-50%",
                    y: "-50%",
                  }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                >
                  {a}
                </motion.span>
              );
            })}
          </motion.div>
        </div>
      </div>
    </SceneFrame>
  );
}

/** Same product, every screen — browser + phone stay in sync. */
function AppsScene() {
  const MiniUI = ({ compact }: { compact?: boolean }) => (
    <div className="space-y-1.5">
      <motion.div
        className="rounded-md bg-gradient-primary p-2 text-white"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-[0.5rem] opacity-80">Bookings today</p>
        <p className="font-display text-sm font-bold leading-none">128</p>
      </motion.div>
      <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-3")}>
        {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
          <span key={i} className="relative h-6 overflow-hidden rounded-md bg-gray-100">
            <motion.span
              className="absolute inset-0 bg-primary/30"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
            />
          </span>
        ))}
      </div>
      <span className="block h-1.5 w-3/4 rounded bg-gray-200" />
      <span className="block h-1.5 w-1/2 rounded bg-gray-200" />
    </div>
  );

  return (
    <SceneFrame>
      <motion.div
        className="absolute left-[7%] top-[14%] w-[62%] overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-float"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5">
          {["bg-tertiary/70", "bg-warning/70", "bg-success/70"].map((c) => (
            <span key={c} className={cn("size-1.5 rounded-full", c)} />
          ))}
          <span className="ml-2 h-2.5 flex-1 rounded-full bg-gray-100" />
        </div>
        <div className="p-2.5">
          <MiniUI />
        </div>
      </motion.div>

      <motion.div
        className="absolute right-[8%] top-[10%] w-[27%] min-w-[5.5rem] rounded-[1.1rem] border-[4px] border-gray-900 bg-surface p-1.5 pt-3 shadow-float"
        animate={{ y: [0, 8, 0], rotate: [3, 0, 3] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span aria-hidden className="absolute left-1/2 top-1 h-1 w-6 -translate-x-1/2 rounded-full bg-gray-900" />
        <MiniUI compact />
      </motion.div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {["Web", "iOS", "Android"].map((p, i) => (
          <motion.span
            key={p}
            className="rounded-full border border-gray-200 bg-surface px-2.5 py-1 text-[0.625rem] font-semibold text-gray-700 shadow-soft"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
          >
            {p}
          </motion.span>
        ))}
      </div>
    </SceneFrame>
  );
}

/** A task travels through the workflow on its own. */
function AutomationScene() {
  const nodes = [
    { icon: Mail, label: "Request in" },
    { icon: Sparkles, label: "AI reads it" },
    { icon: ShieldCheck, label: "Checked" },
    { icon: Database, label: "Synced" },
  ];
  const [count, setCount] = useState(1284);
  useEffect(() => {
    const id = window.setInterval(() => setCount((c) => c + 1), 3000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <SceneFrame>
      <div className="absolute inset-x-[12%] top-[42%]">
        <div className="relative h-px bg-gray-200">
          <motion.span
            className="absolute inset-y-0 left-0 bg-gradient-primary"
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute -top-[5px] z-10 size-[11px] -translate-x-1/2 rounded-full bg-secondary shadow-glow ring-4 ring-secondary/20"
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          {nodes.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className="absolute top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${(i / (nodes.length - 1)) * 100}%` }}
            >
              <motion.span
                className="relative z-20 flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-surface text-gray-500 shadow-soft"
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.4, delay: i }}
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-primary"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.1, delay: i }}
                />
                <Icon className="relative size-5 mix-blend-normal" aria-hidden />
              </motion.span>
              <span className="absolute top-full mt-2 whitespace-nowrap text-[0.625rem] font-medium text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-surface px-3 py-1.5 shadow-soft">
        <span className="size-1.5 animate-pulse rounded-full bg-success" />
        <span className="text-[0.6875rem] text-gray-500">Tasks handled automatically</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            className="font-display text-xs font-bold tabular-nums text-gray-900"
          >
            {count.toLocaleString("en-US")}
          </motion.span>
        </AnimatePresence>
      </div>
    </SceneFrame>
  );
}

/** Live chart that keeps updating, with a forecast — hover a bar. */
function DataScene() {
  const make = () => Array.from({ length: 7 }, (_, i) => 30 + i * 7 + Math.round(Math.random() * 18));
  const [bars, setBars] = useState<number[]>([34, 45, 41, 58, 52, 69, 74]);
  useEffect(() => {
    const id = window.setInterval(() => setBars(make()), 2200);
    return () => window.clearInterval(id);
  }, []);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <SceneFrame>
      <div className="absolute left-5 top-4 rounded-xl border border-gray-100 bg-surface px-3 py-2 shadow-soft">
        <p className="text-[0.625rem] text-gray-500">Revenue this week</p>
        <p className="font-display text-base font-bold text-gray-900">
          $84.2k <span className="text-[0.625rem] font-semibold text-success">▲ 12%</span>
        </p>
      </div>
      <motion.span
        className="absolute right-5 top-5 rounded-full bg-secondary/15 px-2.5 py-1 text-[0.625rem] font-semibold text-secondary-strong"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Forecast +18% ↗
      </motion.span>

      <div className="absolute inset-x-5 bottom-4 top-[38%] flex items-end gap-2">
        {bars.map((h, i) => (
          <div key={i} className="group/bar relative flex h-full flex-1 flex-col items-center justify-end">
            <span className="pointer-events-none absolute -top-5 rounded bg-gray-900 px-1.5 py-0.5 text-[0.5625rem] font-semibold text-background opacity-0 transition-opacity group-hover/bar:opacity-100">
              ${(h * 1.3).toFixed(1)}k
            </span>
            <motion.span
              className={cn(
                "w-full rounded-t-md transition-colors group-hover/bar:bg-primary",
                i === bars.length - 1 ? "bg-gradient-primary" : "bg-secondary/35",
              )}
              animate={{ height: `${h}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
            />
            <span className="mt-1 text-[0.5625rem] text-gray-400">{days[i]}</span>
          </div>
        ))}
        {/* forecast ghost bar */}
        <div className="relative flex h-full flex-1 flex-col items-center justify-end">
          <motion.span
            className="w-full rounded-t-md border-2 border-dashed border-secondary/60"
            animate={{ height: `${Math.min(96, (bars[6] ?? 70) + 14)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          />
          <span className="mt-1 text-[0.5625rem] font-semibold text-secondary-strong">Next</span>
        </div>
      </div>
    </SceneFrame>
  );
}

/** A designer's cursor brings a wireframe to life. */
function DesignScene() {
  const D = 6.5;
  // Wireframe pieces (percent boxes) the cursor visits in order.
  const pieces = [
    { l: 7, t: 10, w: 86, h: 12, fill: "bg-gray-900" },
    { l: 7, t: 28, w: 54, h: 38, fill: "bg-gradient-primary" },
    { l: 65, t: 28, w: 28, h: 38, fill: "bg-secondary/40" },
    { l: 7, t: 72, w: 26, h: 14, fill: "bg-gradient-primary" },
  ];
  const at = (k: number) => k / pieces.length;
  const centers = pieces.map((p) => ({ x: `${p.l + p.w / 2}%`, y: `${p.t + p.h / 2}%` }));

  return (
    <SceneFrame>
      <div className="absolute inset-4 rounded-xl border border-gray-200 bg-surface shadow-soft">
        {pieces.map((p, k) => (
          <div
            key={k}
            className="absolute overflow-hidden rounded-lg bg-gray-100"
            style={{ left: `${p.l}%`, top: `${p.t}%`, width: `${p.w}%`, height: `${p.h}%` }}
          >
            <motion.span
              className={cn("absolute inset-0", p.fill)}
              animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.9, 0.9, 1, 1, 1] }}
              transition={{ duration: D, repeat: Infinity, times: [0, at(k) + 0.06, at(k) + 0.12, 0.94, 1] }}
            />
          </div>
        ))}

        {/* cursor */}
        <motion.div
          className="absolute z-10"
          animate={{
            left: [...centers.map((c) => c.x), centers[0]!.x],
            top: [...centers.map((c) => c.y), centers[0]!.y],
          }}
          transition={{ duration: D, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] }}
        >
          <MousePointer2 className="size-5 fill-tertiary text-tertiary drop-shadow" aria-hidden />
          <span className="ml-3 rounded-full bg-tertiary px-1.5 py-0.5 text-[0.5625rem] font-semibold text-white">Designer</span>
        </motion.div>
      </div>

      {/* palette + feedback */}
      <div className="absolute right-6 top-[42%] flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-surface p-1.5 shadow-float">
        {["bg-primary", "bg-secondary", "bg-tertiary", "bg-gray-900"].map((c) => (
          <span key={c} className={cn("size-4 rounded-md", c)} />
        ))}
      </div>
      <motion.span
        className="absolute bottom-6 right-16 rounded-2xl rounded-br-sm bg-gray-900 px-2.5 py-1.5 text-[0.625rem] font-medium text-background shadow-float"
        animate={{ opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, 0] }}
        transition={{ duration: D, repeat: Infinity, times: [0, 0.8, 0.85, 0.96, 1] }}
      >
        Users will love this ✨
      </motion.span>
    </SceneFrame>
  );
}

/** Traffic rises, servers scale out; the pipeline stays green. */
function CloudScene() {
  const pattern = [2, 3, 5, 6, 4, 3];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % pattern.length), 1600);
    return () => window.clearInterval(id);
  }, [pattern.length]);
  const servers = pattern[step]!;

  return (
    <SceneFrame>
      <div className="absolute left-5 top-4 flex gap-1.5">
        {["Build", "Test", "Deploy"].map((s, i) => (
          <motion.span
            key={s}
            className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[0.625rem] font-semibold text-success"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 1, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, times: [0, 0.2, 1] }}
          >
            <Check className="size-3" strokeWidth={3} aria-hidden /> {s}
          </motion.span>
        ))}
      </div>
      <span className="absolute right-5 top-4 rounded-full bg-gray-900 px-2.5 py-1 text-[0.625rem] font-semibold text-background">
        Uptime 99.99%
      </span>

      <div className="absolute inset-x-5 bottom-14 flex h-24 items-end justify-center gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {Array.from({ length: servers }).map((_, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, scale: 0.4, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.4, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex w-10 flex-col gap-1 rounded-lg border border-gray-200 bg-surface p-1.5 shadow-soft"
            >
              {[0, 1, 2].map((r) => (
                <span key={r} className="flex items-center gap-1">
                  <motion.span
                    className="size-1 rounded-full bg-primary"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.8 + r * 0.3, repeat: Infinity, delay: i * 0.1 }}
                  />
                  <span className="h-1 flex-1 rounded bg-gray-200" />
                </span>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between rounded-xl border border-gray-100 bg-surface px-3 py-1.5 shadow-soft">
        <span className="flex items-center gap-1.5 text-[0.6875rem] text-gray-500">
          <Cloud className="size-3.5 text-secondary" aria-hidden /> Auto-scaling
        </span>
        <span className="font-display text-xs font-bold tabular-nums text-gray-900">
          {servers} instance{servers === 1 ? "" : "s"}
        </span>
      </div>
    </SceneFrame>
  );
}

const offerings: Offering[] = [
  {
    icon: BrainCircuit,
    will: "Think for themselves",
    title: "Agentic Modernization",
    description:
      "Give the systems you already have an AI upgrade. We add intelligent agents that take over decisions and busywork — no risky rewrite, no downtime.",
    points: ["Modernize legacy software", "AI agents & copilots", "Step-by-step, zero downtime"],
    Scene: ModernizeScene,
  },
  {
    icon: Smartphone,
    will: "Work everywhere",
    title: "Custom Web & Mobile Apps",
    description:
      "One great product on every screen. We design and build fast, accessible websites and iOS & Android apps your customers actually enjoy using.",
    points: ["Websites & web apps", "iOS & Android apps", "Built to grow with you"],
    Scene: AppsScene,
  },
  {
    icon: Workflow,
    will: "Run on autopilot",
    title: "Workflow Automation",
    description:
      "Hand repetitive work over to software. We connect your tools and automate everyday processes, so your team saves hours and makes fewer mistakes.",
    points: ["Automate manual tasks", "AI-powered workflows", "Connect the tools you use"],
    Scene: AutomationScene,
  },
  {
    icon: ChartNoAxesCombined,
    will: "See what's coming",
    title: "Data-Driven Apps",
    description:
      "Turn scattered data into clear answers — live dashboards, reports that build themselves and forecasts that help you plan ahead.",
    points: ["Live dashboards", "Smart forecasting", "One source of truth"],
    Scene: DataScene,
  },
  {
    icon: PenTool,
    will: "Delight every user",
    title: "Product Strategy & Design",
    description:
      "Start with the right product. We work alongside you to understand your users, shape the idea and design interfaces people love to use.",
    points: ["Discovery workshops", "UX research & testing", "Clickable prototypes"],
    Scene: DesignScene,
  },
  {
    icon: Cloud,
    will: "Scale effortlessly",
    title: "Cloud & DevOps",
    description:
      "Infrastructure that just works. Secure, cost-efficient cloud setups with automated releases, so you can grow without worrying about downtime.",
    points: ["AWS · Google Cloud · Azure", "Automated releases", "24/7 monitoring"],
    Scene: CloudScene,
  },
];

const COUNT = offerings.length;
const STOPS = offerings.map((_, i) => i);

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function OfferingsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Advances on its own every few seconds; tabs, arrows and the controls jump directly.
  const auto = useAutoplay(sectionRef, { stops: STOPS, hold: 5.5 });
  // Scrolling over the list or the card steps through the offerings.
  const listRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const wheel = useWheelSteps(auto, [listRef, cardRef], { hintKey: "offerings" });
  const active = auto.index;
  // Slide direction for the transition: forwards unless the visitor stepped back.
  const prevActive = useRef(active);
  const direction = active >= prevActive.current || (prevActive.current === COUNT - 1 && active === 0) ? 1 : -1;
  useEffect(() => {
    prevActive.current = active;
  }, [active]);

  const select = (i: number) => auto.go(i);

  // Phones/tablets: the tabs scroll sideways; keep the playing one visible.
  const stripRef = useRef<HTMLDivElement>(null);
  useScrollActiveIntoView(stripRef, [active]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const dir =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + COUNT) % COUNT;
    select(next);
    tabRefs.current[next]?.focus();
  }

  const current = offerings[active]!;
  const Icon = current.icon;
  const counter = `${String(active + 1).padStart(2, "0")} / ${String(COUNT).padStart(2, "0")}`;

  return (
    <section ref={sectionRef} id="offerings" className="relative scroll-mt-20 bg-surface-muted">
      <div>
        <div className="relative overflow-hidden py-24 lg:py-28">
          <div aria-hidden className="absolute -left-40 top-1/4 size-[40rem] bg-glow-primary opacity-[0.12]" />
          <div aria-hidden className="absolute -right-48 bottom-0 size-[36rem] bg-glow-secondary opacity-[0.1]" />

          <Container className="relative grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            {/* Left: sentence + picker */}
            <div className="min-w-0 lg:col-span-5">
              <Eyebrow>Core offerings</Eyebrow>
              <h2 className="mt-5 text-display-3 !leading-[1.08] lg:!text-[clamp(2rem,3.4vw,3rem)]">
                We support you by developing apps that will{" "}
                <span className="relative block min-h-[2.3em]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={current.will}
                      className="inline-block text-gradient-primary"
                      initial={{ opacity: 0, y: `${0.35 * direction}em` }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: `${-0.35 * direction}em` }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {current.will.toLowerCase()}.
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h2>

              <div ref={listRef} className="relative mt-6 lg:mt-8" {...auto.hoverProps}>

                <div
                  ref={stripRef}
                  role="tablist"
                  aria-label="Our offerings"
                  aria-orientation="vertical"
                  onKeyDown={onKeyDown}
                  className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0"
                >
                  {offerings.map((o, i) => {
                    const selected = i === active;
                    const TabIcon = o.icon;
                    return (
                      <button
                        key={o.title}
                        ref={(el) => {
                          tabRefs.current[i] = el;
                        }}
                        id={`offering-tab-${i}`}
                        role="tab"
                        type="button"
                        aria-selected={selected}
                        aria-controls="offering-panel"
                        tabIndex={selected ? 0 : -1}
                        onClick={() => select(i)}
                        className={cn(
                          "group relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition-colors",
                          selected ? "text-gray-900" : "text-gray-500 hover:text-gray-900",
                        )}
                      >
                        {selected && (
                          <motion.span
                            layoutId="offering-pill"
                            className="absolute inset-0 rounded-2xl border border-gray-200/80 bg-surface shadow-soft"
                            transition={{ type: "spring", stiffness: 380, damping: 34 }}
                          >
                            <span className="absolute inset-x-4 bottom-1 h-0.5 overflow-hidden rounded-full bg-gray-100">
                              <motion.span
                                className="block h-full origin-left rounded-full bg-gradient-primary"
                                style={{ scaleX: auto.holdProgress }}
                              />
                            </span>
                          </motion.span>
                        )}
                        <span
                          className={cn(
                            "relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                            selected
                              ? "rotate-[-6deg] bg-gradient-primary text-white shadow-glow"
                              : "bg-gray-100 text-gray-500 group-hover:rotate-[-6deg] group-hover:bg-primary/15 group-hover:text-primary-strong",
                          )}
                        >
                          <TabIcon className="size-4" aria-hidden />
                        </span>
                        <span className="relative min-w-0">
                          <span className="block whitespace-nowrap font-display text-sm font-semibold lg:text-[0.9375rem]">
                            {o.will}
                          </span>
                          <span className="hidden text-xs text-gray-500 lg:block">{o.title}</span>
                        </span>
                        <span className="relative ml-auto hidden font-display text-xs font-semibold tabular-nums text-gray-300 lg:block">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: stage */}
            <div
              ref={cardRef}
              {...auto.hoverProps}
              className="relative min-w-0 lg:col-span-7"
              id="offering-panel"
              role="tabpanel"
              aria-labelledby={`offering-tab-${active}`}
            >
              <ScrollHint
                show={wheel.hover || wheel.peek}
                index={active}
                count={COUNT}
                noun="offering"
                className="inset-x-0 -bottom-7 hidden lg:flex"
              />
              <Tilt max={5} glare className="group rounded-[1.75rem]">
                <div className="border-gradient relative overflow-hidden rounded-[1.75rem] bg-surface p-4 shadow-float sm:p-5">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={current.title}
                      initial={{ opacity: 0, y: 14 * direction }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 * direction }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <current.Scene />

                      <div className="px-2 pb-2 pt-5 sm:px-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-strong">
                            <Icon className="size-5" aria-hidden />
                          </span>
                          <h3 className="text-h2">{current.title}</h3>
                          <span className="ml-auto hidden shrink-0 font-display text-sm font-semibold tabular-nums text-gray-400 sm:block">
                            {counter}
                          </span>
                        </div>
                        <p className="mt-3 max-w-xl text-body-sm text-gray-500">{current.description}</p>

                        <ul className="mt-5 flex flex-wrap gap-2">
                          {current.points.map((p, i) => (
                            <motion.li
                              key={p}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 + i * 0.07 }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                            >
                              <Check className="size-3 text-primary-strong" strokeWidth={3} aria-hidden />
                              {p}
                            </motion.li>
                          ))}
                        </ul>

                        <Link
                          href="/contact"
                          className="mt-6 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-gradient-primary"
                        >
                          Discuss your idea
                          <ArrowRight className="size-4 text-secondary" aria-hidden />
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Tilt>
            </div>
          </Container>

        </div>
      </div>
    </section>
  );
}
