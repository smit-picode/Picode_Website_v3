"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowRight, Check, Lightbulb, MessagesSquare, PenTool, Rocket, RotateCcw, Send } from "lucide-react";
import { useScrollActiveIntoView } from "@/components/motion/use-scroll-active-into-view";
import { VisionPreview } from "@/components/sections/hero/vision-preview";
import { ideaFromPrompt, visionIdeas, type VisionIdea } from "@/components/sections/hero/vision-ideas";
import { saveBriefHandoff } from "@/lib/brief-handoff";
import { cn } from "@/lib/utils";

/* Timeline (seconds) — when each message lands in the conversation */
const T_PROBLEM = 1.0;
const T_REPLY = 2.5;
const T_PROPOSAL = 3.7;
const T_APPROVE = 4.9;
const T_DESIGN = 6.1;
const T_BUILD_MSG = 7.3;
const T_SHIP = 9.6;
const T_HOLD = 14; // autoplay moves to the next scenario after this
const TYPING = 0.75; // typing indicator shows this long before a message

const steps = [
  { label: "Understand", icon: MessagesSquare, end: T_REPLY },
  { label: "Propose", icon: Lightbulb, end: T_APPROVE },
  { label: "Design", icon: PenTool, end: T_DESIGN },
  { label: "Build", icon: Rocket, end: T_SHIP },
] as const;

function statusFor(t: number) {
  if (t < T_REPLY) return "Listening";
  if (t < T_APPROVE) return "Proposing a solution";
  if (t < T_DESIGN) return "Designing";
  if (t < T_SHIP) return "Building";
  return "Live";
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Message =
  | { at: number; from: "client" | "team"; type: "text"; text: string }
  | { at: number; from: "team"; type: "proposal" };

function threadFor(idea: VisionIdea): Message[] {
  return [
    { at: T_PROBLEM, from: "client", type: "text", text: idea.problem },
    { at: T_REPLY, from: "team", type: "text", text: idea.reply },
    { at: T_PROPOSAL, from: "team", type: "proposal" },
    { at: T_APPROVE, from: "client", type: "text", text: "That's exactly what we need — let's do it!" },
    { at: T_DESIGN, from: "team", type: "text", text: "First designs are ready for your review 👀" },
    { at: T_BUILD_MSG, from: "team", type: "text", text: "Approved designs are now in build — AI speeds up our engineering, you get weekly demos." },
  ];
}

export function VisionStudio() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.2 });
  const [idea, setIdea] = useState<VisionIdea>(visionIdeas[0]!);
  // The example chips scroll sideways; keep the one that's playing visible as ideas cycle.
  const chipsRef = useRef<HTMLDivElement>(null);
  useScrollActiveIntoView(chipsRef, [idea.id], '[aria-pressed="true"]');
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [prompt, setPrompt] = useState("");

  // Kick off shortly after the hero copy has animated in.
  useEffect(() => {
    const id = window.setTimeout(() => setRunning(true), 900);
    return () => window.clearTimeout(id);
  }, []);

  // Single clock for the whole sequence.
  useEffect(() => {
    if (!running || !inView) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => prev + dt);
    }, 40);
    return () => window.clearInterval(id);
  }, [running, inView]);

  // Autoplay to the next scenario / stop at the end when the visitor is driving.
  useEffect(() => {
    if (autoplay && t >= T_HOLD) {
      const i = visionIdeas.findIndex((v) => v.id === idea.id);
      setIdea(visionIdeas[(i + 1) % visionIdeas.length]!);
      setT(0);
    } else if (!autoplay && t >= T_SHIP + 0.2) {
      setRunning(false);
    }
  }, [t, autoplay, idea.id]);

  function start(next: VisionIdea) {
    setIdea(next);
    setT(0);
    setRunning(true);
    setAutoplay(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (text.length < 3) return;
    start(ideaFromPrompt(text));
    setPrompt("");
  }

  const designed = t >= T_DESIGN;
  const fill = clamp01((t - T_DESIGN - 0.3) / (T_SHIP - T_DESIGN - 0.6));
  const shipped = t >= T_SHIP;
  const status = statusFor(t);

  return (
    <div ref={rootRef} className="relative">
      {/* Glow halo */}
      <div aria-hidden className="absolute -inset-10 -z-10 bg-glow-brand opacity-25 blur-0" />

      <div className="border-gradient relative rounded-[1.75rem] bg-surface/85 p-3 shadow-float backdrop-blur-xl sm:p-4">
        {/* Header: who's talking */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex -space-x-2" aria-hidden>
            <Avatar from="client" name={idea.client.name} className="ring-2 ring-surface" />
            <Avatar from="team" className="ring-2 ring-surface" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-xs font-semibold text-gray-900">
              {idea.client.name} <span className="font-normal text-gray-400">&amp;</span> Picode team
            </p>
            <p className="truncate text-[0.6875rem] text-gray-500">{idea.client.role} · Project chat</p>
          </div>
          <span
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium",
              shipped ? "bg-success/15 text-success" : "bg-primary/10 text-primary-strong",
            )}
            aria-live="polite"
          >
            {shipped ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
            )}
            {status}
          </span>
        </div>

        {/* Problem input */}
        <form onSubmit={onSubmit} className="mt-3">
          <label className="group relative flex items-center rounded-2xl border border-gray-200 bg-gray-50 transition-colors focus-within:border-primary/60 focus-within:bg-surface">
            <span className="sr-only">Tell us about your problem</span>
            <MessagesSquare className="ml-3.5 size-4 shrink-0 text-primary-strong" aria-hidden />
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={120}
              placeholder="Tell us your problem… e.g. patients keep missing appointments"
              className="h-12 w-full min-w-0 bg-transparent px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={prompt.trim().length < 3}
              className="mr-1.5 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-primary px-3 text-xs font-semibold text-white shadow-glow transition-opacity disabled:opacity-40"
            >
              <Send className="size-3.5" aria-hidden /> Send
            </motion.button>
          </label>
        </form>

        {/* Example problems */}
        <div ref={chipsRef} className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {visionIdeas.map((v) => {
            const active = v.id === idea.id;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={active}
                onClick={() => start(v)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-colors",
                  active
                    ? "border-primary/50 bg-primary/10 text-primary-strong"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900",
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Engagement steps */}
        <ol className="mt-4 grid grid-cols-4 gap-2 px-1" aria-label="How we work together">
          {steps.map((s, i) => {
            const startAt = i === 0 ? 0 : steps[i - 1]!.end;
            const p = clamp01((t - startAt) / (s.end - startAt));
            const done = p >= 1;
            const active = p > 0 && !done;
            const Icon = s.icon;
            return (
              <li key={s.label} className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                      done ? "bg-gradient-primary text-white" : active ? "bg-primary/15 text-primary-strong" : "bg-gray-100 text-gray-400",
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
                  </span>
                  <span
                    className={cn("truncate text-[0.6875rem] font-semibold", done || active ? "text-gray-900" : "text-gray-400")}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${p * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ol>

        {/* Workspace: conversation + what we deliver */}
        <div className="relative mt-4 grid h-[19.5rem] gap-3 sm:grid-cols-[1.12fr_1fr]">
          <Conversation idea={idea} t={t} shipped={shipped} />
          <div className="hidden sm:block">
            <VisionPreview kind={idea.kind} title={idea.title} designed={designed} fill={fill} shipped={shipped} />
          </div>

          {/* Result */}
          <AnimatePresence>
            {shipped && (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="absolute inset-x-2 bottom-2 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-surface/95 p-3 shadow-float backdrop-blur"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                  <Rocket className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-gray-900">{idea.title} is live</p>
                  <p className="truncate text-[0.6875rem] text-gray-500">{idea.result}</p>
                </div>
                {!autoplay && (
                  <button
                    type="button"
                    onClick={() => start(idea)}
                    aria-label="Replay"
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:text-gray-900"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                )}
                <a
                  href="/contact"
                  onClick={() => saveBriefHandoff({ story: `Hi Picode! Here's the problem we'd like to solve: ${idea.problem} ` })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3.5 py-2 text-xs font-semibold text-white shadow-glow"
                >
                  Solve mine <ArrowRight className="size-3.5" aria-hidden />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Conversation thread                                                 */
/* ------------------------------------------------------------------ */
function Avatar({ from, name, className }: { from: "client" | "team"; name?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full font-display text-[0.6875rem] font-bold",
        from === "team" ? "bg-gradient-primary text-white" : "bg-gray-900 text-background",
        className,
      )}
    >
      {from === "team" ? "p" : (name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((d) => (
        <motion.span
          key={d}
          className="size-1.5 rounded-full bg-gray-400"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
        />
      ))}
    </span>
  );
}

function Bubble({ from, children }: { from: "client" | "team"; children: React.ReactNode }) {
  const client = from === "client";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn("flex items-end gap-1.5", client && "flex-row-reverse")}
    >
      {!client && <Avatar from="team" className="size-5 text-[0.5625rem]" />}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-[0.75rem] leading-snug",
          client
            ? "rounded-br-md bg-gray-900 text-background"
            : "rounded-bl-md border border-gray-100 bg-gray-50 text-gray-700",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Conversation({ idea, t, shipped }: { idea: VisionIdea; t: number; shipped: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const thread = useMemo(() => threadFor(idea), [idea]);
  const visible = thread.filter((m) => t >= m.at);
  const next = thread.find((m) => t < m.at && t >= m.at - TYPING);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible.length, next?.at, shipped]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-surface">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <MessagesSquare className="size-3.5 text-primary-strong" aria-hidden />
        <span className="truncate text-[0.6875rem] font-medium text-gray-500">Your problem → our solution</span>
      </div>
      <div
        ref={scrollRef}
        className={cn("no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-3 py-3", shipped && "pb-24")}
        data-lenis-prevent
      >
        {visible.map((m, i) =>
          m.type === "proposal" ? (
            <Bubble key={`${idea.id}-${i}`} from="team">
              <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-wide text-primary-strong">
                Proposed solution
              </p>
              <p className="mt-0.5 font-semibold text-gray-900">{idea.deliverable}</p>
              <ul className="mt-1.5 space-y-1">
                {idea.plan.map((p) => (
                  <li key={p} className="flex items-start gap-1.5 text-[0.6875rem]">
                    <Check className="mt-0.5 size-3 shrink-0 text-success" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </Bubble>
          ) : (
            <Bubble key={`${idea.id}-${i}`} from={m.from}>
              {m.text}
            </Bubble>
          ),
        )}
        {next && (
          <Bubble key={`${idea.id}-typing-${next.at}`} from={next.from}>
            <TypingDots />
          </Bubble>
        )}
      </div>
    </div>
  );
}
