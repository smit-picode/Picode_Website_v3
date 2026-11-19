"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Bot, Check, Code2, GitMerge, Lightbulb, Loader2, PenTool, RefreshCw, Rocket, ShieldCheck, Sparkles, User, Users, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { CopilotBot, NeuralBackdrop, RisingSparks, RobotSvg, ScanBeam, STAGE_BG } from "@/components/sections/ai-copilot";
import { AutoplayControls, useAutoplay } from "@/components/motion/autoplay";
import { ButtonLink } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type Phase = {
  icon: LucideIcon;
  title: string;
  text: string;
  /** What the AI copilots do during this phase; ticks off as the phase plays. */
  ai: string[];
  outcome: string;
  /** Involvement 0–3 for: you, the Picode team, AI copilots. */
  lanes: [number, number, number];
  /** Story mode: one line per chapter, then who does what. */
  story: { headline: string; you: string; team: string; copilot: string };
};

const phases: Phase[] = [
  {
    icon: Lightbulb,
    title: "Discover",
    text: "We dig into your problem, users and goals, and turn them into a clear, validated plan.",
    ai: ["Synthesizing user interviews", "Mapping competitor features", "Drafting the product spec"],
    outcome: "Clear scope & roadmap",
    lanes: [3, 2, 3],
    story: {
      headline: 'It starts with your problem.',
      you: 'You bring the problem and the people who feel it.',
      team: 'We interview users and map what really matters.',
      copilot: 'Reads every interview overnight and drafts the first spec.',
    },
  },
  {
    icon: PenTool,
    title: "Design",
    text: "Wireframes become clickable prototypes you can try with real users before we build.",
    ai: ["Exploring layout variations", "Checking accessibility", "Assembling the prototype"],
    outcome: "Clickable prototype",
    lanes: [2, 3, 2],
    story: {
      headline: 'Then we make it real enough to click.',
      you: 'You click through the flows and tell us what feels off.',
      team: 'Designers turn the spec into a clickable prototype.',
      copilot: 'Explores layout variations and checks every screen for accessibility.',
    },
  },
  {
    icon: Code2,
    title: "Build",
    text: "Senior engineers paired with AI copilots write clean, reviewed code, and you see progress every week.",
    ai: ["Pairing on the checkout flow", "Reviewing the latest changes", "Optimizing performance"],
    outcome: "Weekly working demos",
    lanes: [1, 3, 3],
    story: {
      headline: 'Every week, something new works.',
      you: 'You see a working demo every week.',
      team: 'Senior engineers build it, properly reviewed.',
      copilot: 'Pairs on the code and reviews every change before a human does.',
    },
  },
  {
    icon: ShieldCheck,
    title: "Test",
    text: "Automated tests, code review and security scans run on every change, so quality never slips.",
    ai: ["Generating test cases", "Scanning for vulnerabilities", "Running the release checklist"],
    outcome: "Secure, reliable release",
    lanes: [1, 2, 3],
    story: {
      headline: 'We try to break it before your users can.',
      you: 'You sign off a release you can trust.',
      team: 'We test the flows that matter most to you.',
      copilot: 'Writes the test cases and scans for vulnerabilities on every change.',
    },
  },
  {
    icon: Rocket,
    title: "Launch & improve",
    text: "We ship, monitor and keep improving. Real usage data shapes the next cycle.",
    ai: ["Deploying to production", "Watching performance live", "Spotting what to improve next"],
    outcome: "Live & always improving",
    lanes: [2, 2, 3],
    story: {
      headline: 'Launch day is where it starts, not ends.',
      you: 'Your users get the product.',
      team: 'We ship, monitor and keep improving.',
      copilot: 'Watches performance live and queues what to improve next.',
    },
  },
];

const N = phases.length;
const PHASE_SECONDS = 6;
const LANES = ["You", "Picode team", "AI copilots"] as const;

/** Interactive run sheet: used on smaller screens and when reduced motion is on. */
function RunSheet() {
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  const jumping = useRef(false);

  /** Continuous position along the run sheet: 2.4 = 40% through phase 3. Wraps after the last phase. */
  const pos = useMotionValue(0);
  const [active, setActive] = useState(0);
  const playing = inView && !hovering && !reduce;

  useAnimationFrame((_, delta) => {
    if (!playing || jumping.current) return;
    const next = pos.get() + delta / 1000 / PHASE_SECONDS;
    pos.set(next >= N ? 0 : next);
  });

  useMotionValueEvent(pos, "change", (v) => {
    const i = Math.min(N - 1, Math.floor(v));
    setActive((prev) => (prev === i ? prev : i));
  });

  function jumpTo(i: number) {
    jumping.current = true;
    animate(pos, i + 0.001, {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        jumping.current = false;
      },
    });
  }

  const phase = phases[active]!;
  const local = useTransform(pos, (v) => v - Math.floor(v)); // progress through the current phase, 0–1

  return (
    <section id="ai-native" className="relative overflow-hidden py-24 lg:py-32">
      <div aria-hidden className="absolute -right-40 top-10 -z-10 size-[44rem] bg-glow-secondary opacity-[0.1]" />
      <div aria-hidden className="absolute -left-40 bottom-0 -z-10 size-[36rem] bg-glow-primary opacity-[0.1]" />
      {/* soft blends with the grey sections above and below */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-surface-muted to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-surface-muted" />

      <Container>
        {/* Editorial header */}
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-7">
            <Eyebrow>We are AI native</Eyebrow>
            <h2 className="mt-6 text-display-3">
              An <span className="text-gradient-primary">AI-Driven</span> Development Lifecycle
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-body-md text-gray-500">
              AI isn&apos;t a feature we bolt on. It&apos;s how we work. Every phase is augmented by intelligent
              tooling, and every launch feeds the next cycle.
            </p>
            <ButtonLink href="/#contact" size="lg" className="mt-6">
              Start your project
            </ButtonLink>
          </div>
        </Reveal>

        {/* The run sheet */}
        <Reveal delay={0.1} className="mt-12 lg:mt-16">
          <div
            ref={panelRef}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            className="overflow-hidden rounded-[1.75rem] border border-gray-200/90 bg-surface shadow-float"
          >
            {/* Timeline */}
            <ol className="grid grid-cols-5 border-b border-gray-200/80" aria-label="Lifecycle phases">
              {phases.map((p, i) => (
                <TimelineCell key={p.title} phase={p} index={i} active={i === active} done={i < active} pos={pos} onSelect={() => jumpTo(i)} />
              ))}
            </ol>

            {/* Active phase: brief + deliverable */}
            <div className="grid lg:grid-cols-[1fr_1.2fr]">
              <div className="relative p-6 sm:p-8 lg:p-10">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={phase.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-strong">
                      Phase {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">{phase.title}</h3>
                    <p className="mt-3 max-w-md text-body-md text-gray-500">{phase.text}</p>

                    <p className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-gray-900">
                      <span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
                        <Check className="size-3" aria-hidden />
                      </span>
                      You get: {phase.outcome}
                    </p>

                    <div className="mt-7 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4">
                      <p className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                        <Sparkles className="size-3.5 text-primary-strong" aria-hidden /> AI copilots in this phase
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {phase.ai.map((task, k) => (
                          <AiTask key={task} task={task} at={(k + 1) / (phase.ai.length + 1)} local={local} still={!!reduce} />
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Deliverable on a case-study style stage */}
              <div className="relative border-t border-gray-200/80 p-3 sm:p-4 lg:border-l lg:border-t-0">
                <div
                  className="relative isolate flex h-full min-h-[28rem] items-start justify-center overflow-hidden rounded-[1.35rem] p-6 pb-44 sm:justify-end sm:p-8 sm:pb-40 xl:pb-8"
                >
                  {/* each phase lights the stage a little differently */}
                  {STAGE_BG.map((bg, i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="absolute inset-0 -z-20 transition-opacity duration-700"
                      style={{ background: bg, opacity: i === active ? 1 : 0 }}
                    />
                  ))}
                  <NeuralBackdrop />
                  {active === 4 && <RisingSparks />}
                  <p
                    aria-hidden
                    className="pointer-events-none absolute -bottom-8 left-6 -z-10 whitespace-nowrap font-display text-[8rem] font-bold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.1)]"
                  >
                    {phase.title}
                  </p>
                  <span className="absolute left-5 top-5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-white/70">
                    Deliverable · {phase.outcome}
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={phase.title}
                      initial={{ opacity: 0, y: 24, rotateX: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 160, damping: 22 }}
                      className="theme-light relative mt-6 w-full max-w-[24rem] [perspective:1200px] sm:mt-8"
                    >
                      <Artifact index={active} local={local} />
                      {active === 3 && <ScanBeam />}
                    </motion.div>
                  </AnimatePresence>
                  <CopilotBot key={phase.title} phase={active} tasks={phase.ai} local={local} />
                </div>
              </div>
            </div>

            {/* Who does what */}
            <div className="border-t border-gray-200/80 px-4 py-5 sm:px-8">
              <div className="grid grid-cols-[5.5rem_repeat(5,1fr)] items-center gap-x-2 gap-y-2.5 sm:grid-cols-[7.5rem_repeat(5,1fr)] sm:gap-x-3">
                {LANES.map((lane, l) => (
                  <Lane key={lane} label={lane} lane={l} active={active} />
                ))}
              </div>
              <p className="mt-4 flex items-center justify-end gap-1.5 text-xs text-gray-500">
                <RefreshCw className="size-3.5 text-primary-strong" aria-hidden /> Every launch feeds the next cycle
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                             */
/* ------------------------------------------------------------------ */

function TimelineCell({
  phase,
  index,
  active,
  done,
  pos,
  onSelect,
}: {
  phase: Phase;
  index: number;
  active: boolean;
  done: boolean;
  pos: MotionValue<number>;
  onSelect: () => void;
}) {
  const Icon = phase.icon;
  const fill = useTransform(pos, (v) => Math.min(1, Math.max(0, v - index)));
  return (
    <li className={cn("relative", index > 0 && "border-l border-gray-200/80")}>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "step" : undefined}
        aria-label={`Phase ${index + 1}: ${phase.title}`}
        className={cn(
          "group relative flex w-full flex-col items-center gap-2 px-2 pb-4 pt-5 text-center transition-colors sm:flex-row sm:items-center sm:gap-3 sm:px-5 sm:text-left",
          active ? "bg-primary/[0.05]" : "hover:bg-gray-50",
        )}
      >
        {/* progress rail */}
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gray-100">
          <motion.span style={{ scaleX: fill }} className="block h-full origin-left bg-gradient-primary" />
        </span>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
            active ? "bg-gradient-primary text-white shadow-glow" : done ? "bg-primary/10 text-primary-strong" : "bg-gray-100 text-gray-400 group-hover:text-primary-strong",
          )}
        >
          {done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
        </span>
        <span className="min-w-0">
          <span className="block font-mono text-[0.625rem] tabular-nums text-gray-400">{String(index + 1).padStart(2, "0")}</span>
          <span className={cn("hidden truncate font-display text-sm font-semibold sm:block", active ? "text-gray-900" : "text-gray-500")}>
            {phase.title}
          </span>
        </span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* AI task: spinner → tick as the phase progresses                      */
/* ------------------------------------------------------------------ */

function AiTask({ task, at, local, still }: { task: string; at: number; local: MotionValue<number>; still: boolean }) {
  const [done, setDone] = useState(still);
  useMotionValueEvent(local, "change", (v) => {
    if (still) return;
    const d = v >= at;
    setDone((prev) => (prev === d ? prev : d));
  });
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
          done ? "bg-primary text-white" : "bg-white text-primary-strong ring-1 ring-gray-200 dark:bg-transparent",
        )}
      >
        {done ? <Check className="size-3" aria-hidden /> : <Loader2 className="size-3 animate-spin" aria-hidden />}
      </span>
      <span className={cn("transition-colors duration-300", done ? "text-gray-900" : "text-gray-500")}>{task}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Swimlanes                                                            */
/* ------------------------------------------------------------------ */

function Lane({ label, lane, active }: { label: string; lane: number; active: number }) {
  return (
    <>
      <span className="flex items-center gap-1.5 font-display text-xs font-semibold text-gray-600">
        {lane === 2 && <Sparkles className="size-3 text-primary-strong" aria-hidden />}
        {label}
      </span>
      {phases.map((p, i) => {
        const level = p.lanes[lane]!;
        const on = i === active;
        return (
          <span key={p.title} className="relative h-2 rounded-full bg-gray-100" title={`${label} · ${p.title}`}>
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              animate={{ width: `${(level / 3) * 100}%`, opacity: on ? 1 : 0.35 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: lane === 0 ? "rgb(var(--gray-500))" : lane === 1 ? "rgb(var(--fill-from))" : "linear-gradient(90deg, rgb(var(--fill-from)), rgb(var(--fill-to)))" }}
            />
          </span>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Deliverables                                                         */
/* ------------------------------------------------------------------ */

const card = "rounded-2xl bg-white text-gray-900 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55),0_10px_20px_-12px_rgba(0,0,0,0.25)]";
const bar = "h-1.5 rounded-full bg-gray-200";

function Artifact({ index, local }: { index: number; local: MotionValue<number> }) {
  switch (index) {
    case 0:
      return <SpecDoc />;
    case 1:
      return <Wireframe />;
    case 2:
      return <CodeReview local={local} />;
    case 3:
      return <Checks local={local} />;
    default:
      return <LiveMetrics />;
  }
}

function SpecDoc() {
  const insights = ["Users drop off at checkout", "Support repeats the same answers", "Reports take 2 days to build"];
  return (
    <div className={cn(card, "p-5")}>
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold">Product spec · v1</span>
        <span className="rounded-md bg-success/10 px-2 py-0.5 text-[0.625rem] font-semibold text-success">Validated</span>
      </div>
      <div className="mt-4 space-y-2">
        <span className={cn(bar, "block w-[92%]")} />
        <span className={cn(bar, "block w-[78%]")} />
        <span className={cn(bar, "block w-[64%]")} />
      </div>
      <p className="mt-5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-gray-400">Key insights</p>
      <ul className="mt-2 space-y-1.5">
        {insights.map((t, i) => (
          <motion.li
            key={t}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.15 }}
            className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            {t}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Wireframe() {
  return (
    <div className={cn(card, "overflow-hidden")}>
      <div className="flex h-7 items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3">
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} className="size-2 rounded-full" style={{ background: c }} />
        ))}
        <span className="mx-auto rounded bg-gray-100 px-2 font-mono text-[0.5625rem] text-gray-500">prototype · 12 screens</span>
      </div>
      <div className="relative grid grid-cols-[1.1fr_1fr] gap-4 p-5">
        <div className="space-y-2.5">
          <span className="block h-2 w-1/3 rounded-full bg-primary/30" />
          <span className="block h-3.5 w-[92%] rounded bg-gray-800" />
          <span className="block h-3.5 w-[70%] rounded bg-gray-800" />
          <span className={cn(bar, "block w-[85%]")} />
          <span className={cn(bar, "block w-[60%]")} />
          <span className="mt-2 block h-6 w-[45%] rounded-full bg-primary" />
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50" />
        {/* design cursor */}
        <motion.span
          className="absolute"
          initial={{ left: "20%", top: "70%" }}
          animate={{ left: ["20%", "64%", "36%", "20%"], top: ["70%", "34%", "48%", "70%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M1 1l5 14 2-6 6-2z" fill="#0f172a" stroke="white" strokeWidth="1.2" />
          </svg>
          <span className="ml-3 rounded bg-secondary px-1.5 py-0.5 text-[0.5625rem] font-semibold text-white">Designer</span>
        </motion.span>
      </div>
      <div className="flex gap-1.5 border-t border-gray-100 px-5 py-3">
        {["#0d9488", "#38bdf8", "#0f172a", "#e2e8f0"].map((c) => (
          <span key={c} className="size-5 rounded-md ring-1 ring-black/5" style={{ background: c }} />
        ))}
        <span className="ml-auto self-center text-[0.625rem] font-medium text-gray-400">AA contrast ✓</span>
      </div>
    </div>
  );
}

function CodeReview({ local }: { local: MotionValue<number> }) {
  const [merged, setMerged] = useState(false);
  useMotionValueEvent(local, "change", (v) => setMerged((m) => (m === v > 0.7 ? m : v > 0.7)));
  const lines: [string, string][] = [
    ["text-[#c084fc]", "export async function checkout(cart) {"],
    ["text-[#94a3b8]", "  const total = sum(cart.items);"],
    ["text-[#5eead4]", "  await payments.charge(total);"],
    ["text-[#94a3b8]", "  return receipt(cart);"],
    ["text-[#c084fc]", "}"],
  ];
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-[#0b1220] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="font-mono text-[0.625rem] text-white/60">checkout.ts</span>
          <span className="flex items-center gap-1 text-[0.625rem] font-medium text-[#5eead4]">
            <Sparkles className="size-3" aria-hidden /> Copilot
          </span>
        </div>
        <pre className="px-4 py-3 font-mono text-[0.6875rem] leading-relaxed">
          {lines.map(([c, l], i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.18 }} className={c}>
              <span className="mr-3 select-none text-white/25">{i + 1}</span>
              {l}
            </motion.div>
          ))}
        </pre>
      </div>
      <div className={cn(card, "flex items-center gap-3 px-4 py-3")}>
        <span className={cn("flex size-8 items-center justify-center rounded-lg transition-colors duration-300", merged ? "bg-[#8250df] text-white" : "bg-gray-100 text-gray-500")}>
          <GitMerge className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xs font-semibold">PR #128 · One-tap checkout</p>
          <p className="text-[0.625rem] text-gray-500">2 approvals · AI review passed</p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[0.625rem] font-semibold", merged ? "bg-[#8250df]/10 text-[#8250df]" : "bg-gray-100 text-gray-500")}>
          {merged ? "Merged" : "In review"}
        </span>
      </div>
    </div>
  );
}

function Checks({ local }: { local: MotionValue<number> }) {
  const items = ["Unit tests · 248 passed", "End-to-end flows", "Security scan · 0 issues", "Lighthouse · 98"];
  const [n, setN] = useState(0);
  useMotionValueEvent(local, "change", (v) => {
    const k = Math.min(items.length, Math.floor(v * (items.length + 1)));
    setN((prev) => (prev === k ? prev : k));
  });
  return (
    <div className={cn(card, "p-5")}>
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold">Release checks</span>
        <span className="font-mono text-[0.625rem] text-gray-500">
          {n}/{items.length}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((t, i) => {
          const ok = i < n;
          return (
            <li key={t} className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2 text-xs">
              <span className={cn("flex size-5 items-center justify-center rounded-full", ok ? "bg-success text-white" : "text-gray-400")}>
                {ok ? <Check className="size-3" aria-hidden /> : <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              </span>
              <span className={ok ? "text-gray-900" : "text-gray-500"}>{t}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <motion.div className="h-full rounded-full bg-success" animate={{ width: `${(n / items.length) * 100}%` }} />
      </div>
    </div>
  );
}

function LiveMetrics() {
  const pts = [30, 34, 31, 42, 40, 52, 49, 61, 66, 72];
  const d = pts.map((y, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * 300} ${90 - y}`).join(" ");
  return (
    <div className={cn(card, "p-5")}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-sm font-semibold">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
            <span className="relative size-2 rounded-full bg-success" />
          </span>
          Live · v1.4 deployed
        </span>
        <span className="font-mono text-[0.625rem] text-gray-500">today</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Uptime", "99.98%"],
          ["p95", "180ms"],
          ["Active users", "+24%"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-gray-50 px-2.5 py-2">
            <p className="text-[0.5625rem] uppercase tracking-wider text-gray-400">{k}</p>
            <p className="font-display text-sm font-bold">{v}</p>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 300 90" className="mt-4 h-20 w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="metric-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="1" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path d={`${d} L 300 90 L 0 90 Z`} fill="url(#metric-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
        <motion.path d={d} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] font-medium text-primary-strong">
        <RefreshCw className="size-3" aria-hidden /> 3 improvements queued for the next cycle
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section: story on large screens, run sheet elsewhere                 */
/* ------------------------------------------------------------------ */

/** Scroll story only where the whole layout fits on screen and motion is welcome. */
function useStoryMode() {
  const reduce = useReducedMotion();
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (min-height: 760px)");
    const update = () => setFits(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fits && !reduce;
}

export function AINativeSection() {
  return useStoryMode() ? <AIStory /> : <RunSheet />;
}

/* ------------------------------------------------------------------ */
/* Story mode                                                           */
/* ------------------------------------------------------------------ */

/** Chapter positions for the autoplay clock; the robot drifts along the road while a chapter holds. */
const CHAPTERS = Array.from({ length: N }, (_, i) => i);
/** The journey road, winding top to bottom in a 160×1000 box. Chapters sit at STOPS along its length. */
const RW = 160;
const RH = 1000;
const ROAD = "M 70 30 C 140 120, 140 180, 80 265 S 20 420, 80 500 S 140 650, 80 735 S 20 880, 70 970";
const STOPS = [0.0, 0.25, 0.5, 0.75, 1.0];

const clampPos = (v: number) => Math.min(N - 0.001, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function AIStory() {
  const sectionRef = useRef<HTMLElement>(null);
  // Plays itself chapter by chapter while on screen (no scroll-pinning).
  const auto = useAutoplay(sectionRef, { stops: CHAPTERS, hold: 6.5, travel: 1.1, drift: 0.9 });
  /** 0…N: 2.4 = 40% through chapter 3. */
  // Synced from the clock's events (not a render-time transform) so listeners never fire mid-render.
  const pos = useMotionValue(clampPos(auto.value.get()));
  const local = useMotionValue(0);
  useMotionValueEvent(auto.value, "change", (v) => {
    const c = clampPos(v);
    pos.set(c);
    local.set(c - Math.floor(c));
  });
  const [active, setActive] = useState(0);
  const [happy, setHappy] = useState(false);
  useMotionValueEvent(pos, "change", (v) => {
    const i = Math.floor(v);
    setActive((prev) => (prev === i ? prev : i));
    const h = v - i > 0.55;
    setHappy((prev) => (prev === h ? prev : h));
  });

  const goTo = (i: number) => auto.go(i);

  const phase = phases[active]!;

  return (
    <section ref={sectionRef} id="ai-native" className="relative scroll-mt-0">
      <div aria-hidden className="absolute -right-40 top-10 -z-10 size-[44rem] bg-glow-secondary opacity-[0.1]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-surface-muted to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-surface-muted" />

      <div className="relative">
        <div className="flex h-[100svh] max-h-[1000px] min-h-[760px] flex-col pb-6 pt-24">
          <Container className="flex min-h-0 flex-1 flex-col">
            {/* header */}
            <div className="grid grid-cols-12 items-end gap-10">
              <div className="col-span-7">
                <Eyebrow>We are AI native</Eyebrow>
                <h2 className="mt-4 text-display-3 !text-[clamp(2rem,3.2vw,3rem)] !leading-[1.08]">
                  An <span className="text-gradient-primary">AI-Driven</span> Development Lifecycle
                </h2>
              </div>
              <p className="col-span-5 text-body-sm text-gray-500 xl:text-base">
                Follow a project from first conversation to launch. Our people lead every step, and an AI copilot
                works beside them the whole way.
              </p>
            </div>

            <div className="mt-8 flex min-h-0 flex-1 gap-6 xl:gap-8">
            {/* the journey, top to bottom */}
            <Journey pos={pos} active={active} happy={happy} onSelect={goTo} />

            {/* the chapter */}
            <div {...auto.hoverProps} className="grid min-h-0 flex-1 grid-cols-[1fr_1.15fr] overflow-hidden rounded-[1.75rem] border border-gray-200/90 bg-surface shadow-float">
              <div className="flex min-h-0 flex-col justify-center p-7 xl:p-9">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={phase.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-strong">
                      Chapter {String(active + 1).padStart(2, "0")} · {phase.title}
                    </p>
                    <h3 className="mt-2 font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-gray-900 xl:text-[2rem]">
                      {phase.story.headline}
                    </h3>
                    <ul className="mt-4 space-y-2">
                      <Actor icon={User} who="You" text={phase.story.you} />
                      <Actor icon={Users} who="Picode team" text={phase.story.team} />
                      <Actor icon={Bot} who="AI copilot" text={phase.story.copilot} ai>
                        <CopilotNow tasks={phase.ai} local={local} />
                      </Actor>
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative min-h-0 border-l border-gray-200/80 p-3">
                <div className="relative isolate flex h-full items-center justify-center overflow-hidden rounded-[1.35rem] p-6">
                  {STAGE_BG.map((bg, i) => (
                    <div key={i} aria-hidden className="absolute inset-0 -z-20 transition-opacity duration-700" style={{ background: bg, opacity: i === active ? 1 : 0 }} />
                  ))}
                  <NeuralBackdrop />
                  {active === 4 && <RisingSparks />}
                  <span className="absolute left-5 top-4 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-white/70">
                    You get · {phase.outcome}
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={phase.title}
                      initial={{ opacity: 0, y: 24, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 160, damping: 22 }}
                      className="theme-light relative mt-4 w-full max-w-[23rem]"
                    >
                      <Artifact index={active} local={local} />
                      {active === 3 && <ScanBeam />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            </div>
            <div className="mt-4 flex justify-center">
              <AutoplayControls auto={auto} label="stage" />
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}

function Actor({ icon: Icon, who, text, ai, children }: { icon: LucideIcon; who: string; text: string; ai?: boolean; children?: ReactNode }) {
  return (
    <li
      className={cn(
        "flex gap-3 rounded-2xl border px-3.5 py-2.5",
        ai ? "border-primary/25 bg-primary/[0.06]" : "border-gray-200/80 bg-gray-50/60",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl",
          ai ? "bg-gradient-primary text-white shadow-glow" : "bg-surface text-gray-500 ring-1 ring-gray-200",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={cn("font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em]", ai ? "text-primary-strong" : "text-gray-500")}>{who}</p>
        <p className="mt-0.5 text-sm leading-snug text-gray-800">{text}</p>
        {children}
      </div>
    </li>
  );
}

/** The copilot's live status line: the task it is on right now. */
function CopilotNow({ tasks, local }: { tasks: string[]; local: MotionValue<number> }) {
  const [k, setK] = useState(0);
  useMotionValueEvent(local, "change", (v) => {
    const i = Math.min(tasks.length - 1, Math.floor(v * tasks.length));
    setK((prev) => (prev === i ? prev : i));
  });
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary-strong">
      <Loader2 className="size-3 animate-spin" aria-hidden />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={k} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {tasks[k]}…
        </motion.span>
      </AnimatePresence>
    </p>
  );
}

/** The road the copilot travels, top to bottom: chapters are stops, and the line draws itself as you scroll. */
function Journey({ pos, active, happy, onSelect }: { pos: MotionValue<number>; active: number; happy: boolean; onSelect: (i: number) => void }) {
  const roadRef = useRef<SVGPathElement>(null);
  const [geo, setGeo] = useState<{ len: number; stops: { x: number; y: number }[] } | null>(null);

  useEffect(() => {
    const p = roadRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    setGeo({ len, stops: STOPS.map((f) => p.getPointAtLength(f * len)) });
  }, []);

  /** Where the copilot is along the road (0–1): it works at a stop, then walks to the next. */
  const frac = useTransform(pos, (v) => {
    const i = Math.min(N - 1, Math.floor(v));
    if (i === N - 1) return STOPS[i]!;
    const t = Math.max(0, (v - i - 0.6) / 0.4);
    return STOPS[i]! + (STOPS[i + 1]! - STOPS[i]!) * ease(t);
  });
  const point = (f: number) => (geo && roadRef.current ? roadRef.current.getPointAtLength(f * geo.len) : { x: 70, y: 30 });
  const left = useTransform(frac, (f) => `${(point(f).x / RW) * 100}%`);
  const top = useTransform(frac, (f) => `${(point(f).y / RH) * 100}%`);
  const [moving, setMoving] = useState(false);
  useMotionValueEvent(pos, "change", (v) => {
    const w = Math.floor(v) < N - 1 && v - Math.floor(v) > 0.6;
    setMoving((m) => (m === w ? m : w));
  });

  return (
    <div className="relative w-[13rem] shrink-0 py-6 xl:w-[14.5rem]">
      <div className="relative ml-16 h-full w-20">
        <svg viewBox={`0 0 ${RW} ${RH}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="road-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(var(--fill-from))" />
              <stop offset="1" stopColor="rgb(var(--fill-to))" />
            </linearGradient>
          </defs>
          <path ref={roadRef} d={ROAD} fill="none" className="stroke-gray-200" strokeWidth="18" strokeLinecap="round" />
          <motion.path d={ROAD} fill="none" stroke="url(#road-grad)" strokeWidth="18" strokeLinecap="round" style={{ pathLength: frac }} />
          <path d={ROAD} fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.5" strokeDasharray="12 18" />
        </svg>

        {/* chapter stops, labelled to the right */}
        {geo?.stops.map((p, i) => {
          const Icon = phases[i]!.icon;
          const on = i === active;
          const done = i < active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Chapter ${i + 1}: ${phases[i]!.title}`}
              aria-current={on ? "step" : undefined}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(p.x / RW) * 100}%`, top: `${(p.y / RH) * 100}%` }}
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl border-2 border-white transition-all duration-300 dark:border-gray-100",
                  on
                    ? "scale-110 bg-gradient-primary text-white shadow-glow"
                    : done
                      ? "bg-primary-soft text-primary-strong shadow-soft"
                      : "bg-surface text-gray-400 shadow-soft group-hover:text-primary-strong",
                )}
              >
                {done ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
              </span>
              <span
                className={cn(
                  "absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap text-left font-display text-sm font-semibold transition-colors",
                  on ? "text-gray-900" : "text-gray-500",
                )}
              >
                <span className="block font-mono text-[0.625rem] font-medium text-gray-400">{String(i + 1).padStart(2, "0")}</span>
                {phases[i]!.title}
              </span>
            </button>
          );
        })}

        {/* the copilot on its way, walking beside the road */}
        {geo && (
          <motion.div className="pointer-events-none absolute z-10 w-14 -translate-x-[135%] -translate-y-[62%] xl:w-16" style={{ left, top }}>
            <motion.div
              animate={moving ? { y: [0, -6, 0], rotate: [-4, 4, -4] } : { y: [0, -3, 0], rotate: 0 }}
              transition={{ duration: moving ? 0.45 : 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <RobotSvg phase={active} happy={happy && !moving} still={false} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
