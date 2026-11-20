"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  ChartNoAxesCombined,
  Check,
  CornerDownLeft,
  Flag,
  Gauge,
  Globe,
  HelpCircle,
  Layers,
  Lightbulb,
  Loader2,
  Palette,
  RefreshCw,
  Rocket,
  RotateCcw,
  Send,
  Smartphone,
  Timer,
  TrendingUp,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import {
  BRIEF_BUDGETS,
  BRIEF_STAGES,
  BRIEF_TIMELINES,
  BRIEF_TYPES,
  BUDGET_UNSURE,
} from "@/lib/content/brief";
import { contactSchema, type ContactResponse } from "@/lib/validations/contact";
import { ProjectPreview } from "@/components/contact/project-preview";
import { takeBriefHandoff, type BriefHandoff } from "@/lib/brief-handoff";
import { cn, replyWhen } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Questions                                                            */
/* ------------------------------------------------------------------ */

const TYPE_ICONS: Record<(typeof BRIEF_TYPES)[number], LucideIcon> = {
  Website: Globe,
  "Mobile app": Smartphone,
  "AI / agents": BrainCircuit,
  "Dashboard & data": ChartNoAxesCombined,
  "Workflow automation": Workflow,
  "Modernise legacy": RefreshCw,
  "Not sure yet": HelpCircle,
};
const STAGE_ICONS: LucideIcon[] = [Lightbulb, Palette, Rocket, TrendingUp];
const TIMELINE_ICONS: LucideIcon[] = [Timer, CalendarClock, Flag, Layers];
const TIMELINE_HINTS = ["Under a month", "A focused build", "A bigger product", "Quality over speed"];
const STAGE_HINTS = ["A problem worth solving", "Figma or wireframes", "Users, needs a lift", "Growing fast, need hands"];

const STEPS = [
  { key: "types", label: "Scope", title: "What are we building?", hint: "Pick everything that applies." },
  { key: "stage", label: "Stage", title: "Where are you today?", hint: "No wrong answers." },
  { key: "timeline", label: "Timeline", title: "When would you like to launch?", hint: "We'll plan around it." },
  { key: "budget", label: "Budget", title: "What's the budget range?", hint: "Slide to set it, or skip if you're unsure." },
  { key: "story", label: "Story", title: "Tell us the story.", hint: "Goals, users, what success looks like." },
  { key: "contact", label: "Contact", title: "Where should we send the plan?", hint: "We reply within one business day." },
] as const;

const SPARKS = ["Our users are… ", "It needs to integrate with… ", "Success looks like… ", "The tricky part is… "];

type Answers = {
  types: string[];
  stage: string;
  timeline: string;
  budget: number; // index into BRIEF_BUDGETS, or -1 for "not sure"
  story: string;
  name: string;
  email: string;
  company: string;
  website: string;
};

const EMPTY: Answers = {
  types: [],
  stage: "",
  timeline: "",
  budget: 2,
  story: "",
  name: "",
  email: "",
  company: "",
  website: "",
};

const LETTERS = "ABCDEFG";

/* ------------------------------------------------------------------ */
/* Wizard                                                               */
/* ------------------------------------------------------------------ */

export function BriefWizard({ responseTime }: { responseTime: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [a, setA] = useState<Answers>(EMPTY);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [ref, setRef] = useState("PC-0000");
  const shake = useAnimationControls();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef(step);

  useEffect(() => {
    setRef(`PC-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  // An idea typed elsewhere (homepage CTA, hero "Solve mine") pre-fills the brief.
  useEffect(() => {
    function apply(data: BriefHandoff | null) {
      if (!data) return;
      const types = (data.types ?? []).filter((t) => (BRIEF_TYPES as readonly string[]).includes(t));
      setStatus("idle");
      setA((prev) => ({
        ...prev,
        story: data.story?.trim() ? data.story : prev.story,
        types: types.length ? types : prev.types,
      }));
    }
    apply(takeBriefHandoff());
    function onPrefill(event: Event) {
      const detail = (event as CustomEvent<BriefHandoff | string>).detail;
      apply(typeof detail === "string" ? { story: detail } : detail);
      takeBriefHandoff();
    }
    window.addEventListener("picode:prefill", onPrefill);
    return () => window.removeEventListener("picode:prefill", onPrefill);
  }, []);

  // Move focus to the new question for keyboard & screen-reader users (not on first load).
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    setError(null);
    setA((prev) => ({ ...prev, [k]: v }));
  };

  const budgetLabel = a.budget < 0 ? BUDGET_UNSURE : BRIEF_BUDGETS[a.budget]!;

  function validate(i: number): string | null {
    switch (STEPS[i]!.key) {
      case "types":
        return a.types.length ? null : "Pick at least one — or “Not sure yet”.";
      case "stage":
        return a.stage ? null : "Choose the stage that fits best.";
      case "timeline":
        return a.timeline ? null : "Choose a timeline.";
      case "contact": {
        if (a.name.trim().length < 2) return "Please enter your name.";
        if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) return "Please enter a valid email.";
        return null;
      }
      default:
        return null;
    }
  }

  function fail(msg: string) {
    setError(msg);
    void shake.start({ x: [0, -12, 10, -6, 3, 0], transition: { duration: 0.45 } });
  }

  function go(to: number) {
    if (to > step) {
      const msg = validate(step);
      if (msg) return fail(msg);
    }
    setError(null);
    setDir(to > step ? 1 : -1);
    setStep(to);
  }

  async function submit() {
    for (let i = 0; i < STEPS.length; i++) {
      const msg = validate(i);
      if (msg) {
        setDir(i > step ? 1 : -1);
        setStep(i);
        return fail(msg);
      }
    }
    const payload = {
      name: a.name,
      email: a.email,
      company: a.company,
      message: a.story.trim().length >= 10 ? a.story : `${a.story.trim() ? `${a.story.trim()} — ` : ""}See the project brief.`,
      website: a.website,
      brief: {
        types: a.types,
        stage: a.stage || undefined,
        timeline: a.timeline || undefined,
        budget: budgetTouched || a.budget < 0 ? budgetLabel : undefined,
      },
    };
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check your answers.");

    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as ContactResponse;
      if (!body.ok) {
        setStatus("idle");
        return fail(body.error);
      }
      setStatus("sent");
    } catch {
      setStatus("idle");
      fail("Network error — please check your connection and try again.");
    }
  }

  function restart() {
    setA(EMPTY);
    setBudgetTouched(false);
    setDir(-1);
    setStep(0);
    setStatus("idle");
    setRef(`PC-${Math.floor(1000 + Math.random() * 9000)}`);
  }

  const last = step === STEPS.length - 1;
  const next = () => (last ? void submit() : go(step + 1));

  // Typeform-style keys: A–G pick an option, Enter continues (Ctrl/⌘+Enter inside the story box).
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (status !== "idle") return;
    const target = e.target as HTMLElement;
    const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
    if (e.key === "Enter" && !e.shiftKey && (target.tagName !== "TEXTAREA" || e.metaKey || e.ctrlKey)) {
      if (target.tagName === "BUTTON") return; // let buttons handle their own Enter
      e.preventDefault();
      next();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    const idx = LETTERS.indexOf(e.key.toUpperCase());
    if (idx < 0) return;
    const key = STEPS[step]!.key;
    if (key === "types" && BRIEF_TYPES[idx]) toggleType(BRIEF_TYPES[idx]!);
    if (key === "stage" && BRIEF_STAGES[idx]) set("stage", BRIEF_STAGES[idx]!);
    if (key === "timeline" && BRIEF_TIMELINES[idx]) set("timeline", BRIEF_TIMELINES[idx]!);
  }

  function toggleType(t: string) {
    set("types", a.types.includes(t) ? a.types.filter((x) => x !== t) : [...a.types, t]);
  }

  // Pointer tilt + glare for the deck.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotY = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 150, damping: 18 });
  const rotX = useSpring(useTransform(py, [0, 1], [5, -5]), { stiffness: 150, damping: 18 });
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(520px circle at ${gx} ${gy}, rgba(255,255,255,0.16), transparent 45%)`;
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const preview = {
    types: a.types,
    stage: a.stage,
    timeline: a.timeline,
    budget: budgetTouched || a.budget < 0 ? budgetLabel : "",
    story: a.story.trim(),
    name: a.name.trim(),
    company: a.company.trim(),
  };

  return (
    <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Deck */}
      <div className="lg:col-span-7">
        <Progress step={status === "sent" ? STEPS.length : step} onJump={(i) => i < step && status === "idle" && go(i)} />

        <div
          className="relative mt-6 [perspective:1600px]"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onKeyDown={onKeyDown}
        >
          <motion.div
            className="relative h-[35rem] sm:h-[33rem] [transform-style:preserve-3d]"
            style={{ rotateX: rotX, rotateY: rotY }}
            animate={shake}
          >
            {/* the rest of the deck, peeking out underneath */}
            {[2, 1].map((d) => (
              <div
                key={d}
                aria-hidden
                className="absolute inset-0 rounded-[1.75rem] border border-gray-200/80 bg-surface shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] dark:border-white/10"
                style={{
                  transform: `translateY(${d * 14}px) translateZ(${-d * 30}px) scale(${1 - d * 0.04})`,
                  opacity: Math.max(0, (STEPS.length - step - d) > 0 && status !== "sent" ? 1 - d * 0.28 : 0),
                }}
              />
            ))}

            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div
                key={status === "sent" ? "done" : step}
                custom={dir}
                variants={reduce ? fadeVariants : cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-gray-200/90 bg-surface shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_40px_80px_-40px_rgba(15,23,42,0.45),0_12px_24px_-16px_rgba(15,23,42,0.25)] dark:border-white/10"
                style={{ transformOrigin: "50% 100%" }}
              >
                <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light" style={{ background: glare }} />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent" />

                {status === "sent" ? (
                  <Done name={a.name} refNo={ref} responseTime={responseTime} onRestart={restart} />
                ) : (
                  <form
                    className="relative flex h-full flex-col p-6 sm:p-9"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      next();
                    }}
                  >
                    <header className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-strong">
                          Q{String(step + 1).padStart(2, "0")} · {STEPS[step]!.label}
                        </p>
                        <h3
                          ref={titleRef}
                          tabIndex={-1}
                          className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-gray-900 outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-[2.1rem]"
                        >
                          {STEPS[step]!.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-gray-500">{STEPS[step]!.hint}</p>
                      </div>
                      <span className="font-display text-5xl font-bold leading-none text-gray-100 dark:text-gray-100" aria-hidden>
                        {String(step + 1).padStart(2, "0")}
                      </span>
                    </header>

                    <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-2 pt-0.5" data-lenis-prevent>
                      <StepBody step={step} a={a} set={set} toggleType={toggleType} setBudgetTouched={setBudgetTouched} budgetLabel={budgetLabel} />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p
                          role="alert"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-2 text-sm font-medium text-danger"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <footer className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-5">
                      <button
                        type="button"
                        onClick={() => go(step - 1)}
                        disabled={step === 0}
                        className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-0"
                      >
                        <ArrowLeft className="size-4" aria-hidden /> Back
                      </button>
                      <span className="hidden items-center gap-1.5 text-xs text-gray-400 sm:inline-flex">
                        press <Kbd>Enter <CornerDownLeft className="size-3" aria-hidden /></Kbd>
                      </span>
                      <motion.button
                        type="submit"
                        disabled={status === "sending"}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-primary px-6 font-display text-sm font-semibold text-white shadow-glow disabled:opacity-80"
                      >
                        {status === "sending" ? (
                          <>
                            <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
                          </>
                        ) : last ? (
                          <>
                            Send my brief <Send className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                          </>
                        ) : (
                          <>
                            {step === 3 && !budgetTouched ? "Skip" : "Next"}
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </>
                        )}
                      </motion.button>
                    </footer>

                    {/* Honeypot: hidden from users and assistive tech */}
                    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <label>
                        Website
                        <input
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={a.website}
                          onChange={(e) => set("website", e.target.value)}
                        />
                      </label>
                    </div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Live brief */}
      <div className="lg:col-span-5 lg:pt-14">
        <ProjectPreview data={preview} refNo={ref} sent={status === "sent"} />
      </div>
    </div>
  );
}

const cardVariants = {
  enter: (dir: number) =>
    dir > 0
      ? { y: 28, z: -60, scale: 0.92, rotateX: 8, opacity: 0.6 }
      : { x: "-70%", y: -30, rotateZ: -12, rotateY: 25, opacity: 0 },
  center: {
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 210, damping: 26 },
  },
  exit: (dir: number) =>
    dir > 0
      ? {
          x: "-75%",
          y: -40,
          z: 120,
          rotateZ: -14,
          rotateY: 28,
          opacity: 0,
          transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
        }
      : { y: 28, z: -60, scale: 0.92, opacity: 0, transition: { duration: 0.35 } },
};

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ------------------------------------------------------------------ */
/* Steps                                                                */
/* ------------------------------------------------------------------ */

function StepBody({
  step,
  a,
  set,
  toggleType,
  setBudgetTouched,
  budgetLabel,
}: {
  step: number;
  a: Answers;
  set: <K extends keyof Answers>(k: K, v: Answers[K]) => void;
  toggleType: (t: string) => void;
  setBudgetTouched: (v: boolean) => void;
  budgetLabel: string;
}) {
  switch (STEPS[step]!.key) {
    case "types":
      return (
        <div role="group" aria-label="Project type" className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {BRIEF_TYPES.map((t, i) => (
            <KeyTile key={t} letter={LETTERS[i]!} icon={TYPE_ICONS[t]} label={t} on={a.types.includes(t)} onClick={() => toggleType(t)} multi />
          ))}
        </div>
      );
    case "stage":
      return (
        <div role="radiogroup" aria-label="Project stage" className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {BRIEF_STAGES.map((t, i) => (
            <KeyTile key={t} letter={LETTERS[i]!} icon={STAGE_ICONS[i]!} label={t} sub={STAGE_HINTS[i]} on={a.stage === t} onClick={() => set("stage", t)} />
          ))}
        </div>
      );
    case "timeline":
      return (
        <div role="radiogroup" aria-label="Timeline" className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {BRIEF_TIMELINES.map((t, i) => (
            <KeyTile key={t} letter={LETTERS[i]!} icon={TIMELINE_ICONS[i]!} label={t} sub={TIMELINE_HINTS[i]} on={a.timeline === t} onClick={() => set("timeline", t)} />
          ))}
        </div>
      );
    case "budget":
      return (
        <Fader
          value={a.budget}
          label={budgetLabel}
          onChange={(v) => {
            setBudgetTouched(true);
            set("budget", v);
          }}
        />
      );
    case "story":
      return (
        <div>
          <label htmlFor="brief-story" className="sr-only">
            Tell us about your project
          </label>
          <textarea
            id="brief-story"
            value={a.story}
            onChange={(e) => set("story", e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="We're building… for… and we'd love help with…"
            className="block w-full resize-none rounded-2xl border border-amber-200/70 bg-[#fffdf6] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgba(180,160,110,0.22)_31px,rgba(180,160,110,0.22)_32px)] bg-[length:100%_32px] bg-local px-5 pt-[7px] font-display text-[1.0625rem] leading-[32px] text-gray-900 shadow-[0_2px_0_rgba(0,0,0,0.03),inset_0_1px_0_white] outline-none transition-shadow placeholder:text-amber-900/30 focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#141c2b] dark:bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgba(255,255,255,0.06)_31px,rgba(255,255,255,0.06)_32px)] dark:text-gray-900 dark:placeholder:text-gray-400"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SPARKS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("story", `${a.story}${a.story && !a.story.endsWith(" ") && !a.story.endsWith("\n") ? "\n" : ""}${s}`)}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary/50 hover:text-gray-900"
              >
                + {s.trim()}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">Optional, but it helps us come back with a sharper plan.</p>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-3">
          <Field id="brief-name" label="Your name" value={a.name} onChange={(v) => set("name", v)} autoComplete="name" placeholder="Jane Cooper" />
          <Field id="brief-email" label="Work email" type="email" value={a.email} onChange={(v) => set("email", v)} autoComplete="email" placeholder="jane@company.com" />
          <Field id="brief-company" label="Company (optional)" value={a.company} onChange={(v) => set("company", v)} autoComplete="organization" placeholder="Acme Inc." />
          <p className="pt-1 text-xs text-gray-400">We only use these details to reply to you.</p>
        </div>
      );
  }
}

/** Keycap-style option: raised at rest, pressed in when chosen. */
function KeyTile({
  letter,
  icon: Icon,
  label,
  sub,
  on,
  onClick,
  multi,
}: {
  letter: string;
  icon: LucideIcon;
  label: string;
  sub?: string;
  on: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? undefined : "radio"}
      aria-checked={multi ? undefined : on}
      aria-pressed={multi ? on : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left sm:gap-3 sm:px-3.5 transition-[transform,box-shadow,background-color,border-color] duration-150",
        on
          ? "translate-y-[3px] border-primary/60 bg-primary/[0.07] shadow-[0_0_0_rgb(var(--gray-200)),inset_0_2px_6px_rgb(var(--color-primary)/0.15)]"
          : "border-gray-200 bg-surface shadow-[0_3px_0_rgb(var(--gray-200)),0_8px_16px_-12px_rgba(15,23,42,0.25)] hover:-translate-y-px hover:border-gray-300 hover:shadow-[0_4px_0_rgb(var(--gray-200)),0_10px_18px_-12px_rgba(15,23,42,0.3)] active:translate-y-[3px] active:shadow-none",
      )}
    >
      {/* keyboard letter (desktop) */}
      <span
        className={cn(
          "hidden size-6 shrink-0 items-center justify-center rounded-md border font-mono text-[0.6875rem] font-semibold transition-colors sm:inline-flex",
          on ? "border-primary bg-primary text-white" : "border-gray-200 bg-gray-50 text-gray-500",
        )}
        aria-hidden
      >
        {on ? <Check className="size-3.5" strokeWidth={3} /> : letter}
      </span>
      {on && <Check className="size-[18px] shrink-0 text-primary-strong sm:hidden" strokeWidth={3} aria-hidden />}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          on ? "hidden text-primary-strong sm:block" : "text-gray-400 group-hover:text-gray-600",
        )}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block font-display text-[0.9375rem] font-medium leading-tight text-gray-900">{label}</span>
        {sub && <span className="mt-0.5 block text-xs text-gray-500">{sub}</span>}
      </span>
    </button>
  );
}

/** Studio-mixer style budget fader (a styled native range input underneath). */
function Fader({ value, label, onChange }: { value: number; label: string; onChange: (v: number) => void }) {
  const max = BRIEF_BUDGETS.length - 1;
  const unsure = value < 0;
  const pct = unsure ? 50 : (value / max) * 100;
  return (
    <div className="pt-2">
      <div className="flex items-end justify-between">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={label}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={cn("font-display text-4xl font-semibold tracking-tight sm:text-5xl", unsure ? "text-gray-400" : "text-gray-900")}
          >
            {label}
          </motion.p>
        </AnimatePresence>
        <Gauge className="mb-2 size-6 text-gray-300" aria-hidden />
      </div>

      <div className={cn("relative mt-8 h-16 transition-opacity", unsure && "opacity-40")}>
        {/* groove */}
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-gray-100 shadow-[inset_0_2px_4px_rgba(15,23,42,0.18),0_1px_0_white] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
        <motion.div
          className="absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-gradient-primary"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {/* ticks */}
        {BRIEF_BUDGETS.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-[calc(50%+14px)] h-2 w-px bg-gray-300"
            style={{ left: `${(i / max) * 100}%` }}
          />
        ))}
        {/* knob */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1/2 -ml-5 -mt-7 h-14 w-10 rounded-lg border border-gray-300 bg-[linear-gradient(180deg,#ffffff_0%,#e5e7eb_45%,#f9fafb_55%,#d1d5db_100%)] shadow-[0_8px_14px_-6px_rgba(15,23,42,0.45),inset_0_1px_0_white] dark:border-gray-500"
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
        >
          <span className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 rounded bg-primary" />
          <span className="absolute inset-x-2.5 top-[30%] h-px bg-gray-400/60" />
          <span className="absolute inset-x-2.5 top-[70%] h-px bg-gray-400/60" />
        </motion.div>
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={unsure ? Math.round(max / 2) : value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Budget range"
          aria-valuetext={label}
          className="absolute inset-0 size-full cursor-grab opacity-0 active:cursor-grabbing"
        />
      </div>
      <div className="relative mt-1 h-5 text-[0.6875rem] font-medium text-gray-400">
        {BRIEF_BUDGETS.map((b, i) => (
          <span
            key={b}
            className={cn("absolute -translate-x-1/2 whitespace-nowrap", i === 0 && "translate-x-0", i === max && "-translate-x-full")}
            style={{ left: `${(i / max) * 100}%` }}
          >
            {b}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange(unsure ? 2 : -1)}
        aria-pressed={unsure}
        className={cn(
          "mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          unsure ? "border-primary/60 bg-primary/[0.07] text-gray-900" : "border-gray-200 text-gray-500 hover:text-gray-900",
        )}
      >
        <span className={cn("size-3.5 rounded-full border", unsure ? "border-primary bg-primary" : "border-gray-300")} aria-hidden />
        I&apos;m not sure yet
      </button>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className="group block rounded-2xl border border-gray-200 bg-gray-50 px-4 pb-2.5 pt-2 transition-[border-color,box-shadow,background-color] focus-within:border-primary/60 focus-within:bg-surface focus-within:shadow-[0_0_0_4px_rgb(var(--color-primary)/0.12)]">
      <span className="block font-display text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-primary-strong">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-0.5 block w-full bg-transparent font-display text-lg text-gray-900 outline-none placeholder:text-gray-300 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </label>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold text-gray-500 shadow-[0_1px_0_rgb(var(--gray-200))]">
      {children}
    </kbd>
  );
}

function Progress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex gap-1.5" aria-label="Progress">
      {STEPS.map((s, i) => {
        const done = i < step;
        const here = i === step;
        return (
          <li key={s.key} className="flex-1">
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={!done}
              aria-current={here ? "step" : undefined}
              className="group block w-full text-left disabled:cursor-default"
            >
              <span className="relative block h-1.5 overflow-hidden rounded-full bg-gray-200/80">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary"
                  initial={false}
                  animate={{ width: done ? "100%" : here ? "35%" : "0%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              </span>
              <span
                className={cn(
                  "mt-2 hidden font-mono text-[0.625rem] font-medium uppercase tracking-[0.16em] sm:block",
                  here ? "text-gray-900" : done ? "text-gray-500 group-hover:text-gray-900" : "text-gray-300",
                )}
              >
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Done({ name, refNo, responseTime, onRestart }: { name: string; refNo: string; responseTime: string; onRestart: () => void }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-8 text-center" role="status">
      {/* burst */}
      {Array.from({ length: 14 }, (_, i) => {
        const ang = (i / 14) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            aria-hidden
            className={cn("absolute left-1/2 top-[38%] size-2 rounded-full", i % 2 ? "bg-primary" : "bg-secondary")}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.round(Math.cos(ang) * 150), y: Math.round(Math.sin(ang) * 110), opacity: 0, scale: 0.4 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
          />
        );
      })}
      <motion.span
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="inline-flex size-20 items-center justify-center rounded-3xl bg-gradient-primary text-white shadow-glow"
      >
        <Send className="size-9" aria-hidden />
      </motion.span>
      <h3 className="mt-7 font-display text-3xl font-semibold tracking-tight text-gray-900">
        Brief received{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}!
      </h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
        Reference <span className="font-mono font-semibold text-gray-900">{refNo}</span>. A Picode lead will reply{" "}
        {replyWhen(responseTime)} with next steps.
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <RotateCcw className="size-4" aria-hidden /> Start another brief
      </button>
    </div>
  );
}
