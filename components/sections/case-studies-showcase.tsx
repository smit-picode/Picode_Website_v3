"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { BrowserFrame, PhoneFrame, ProjectMark } from "@/components/case-studies/devices";
import { ScrollHint, useAutoplay, useWheelSteps } from "@/components/motion/autoplay";
import { Container, Eyebrow } from "@/components/ui/container";
import type { CaseStudy, PreviewKind } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/**
 * Case studies as a cinematic, self-playing stage:
 *  - every project owns a full stage in its brand colour; the next one floods in
 *    as a circular wipe rising from below,
 *  - its name runs behind the devices as giant outlined type,
 *  - the devices tilt in 3D with the pointer while their screens scroll,
 *  - "what we did" floats as glass annotations wired to the screen they describe.
 */

/** How far each project's screens glide while it's on stage (in project units). */
const PAD = 0.3;

const mix = (a: string, pct: number, b = "black") => `color-mix(in oklab, ${a} ${pct}%, ${b})`;

/** The closing stage — an invitation that hands over to the contact questionnaire. */
const NEXT_ID = "__your-project";
const NEXT_UP: CaseStudy = {
  id: NEXT_ID,
  name: "Your project",
  category: "Next up · Anything you can imagine",
  headline: "Your product,",
  headlineAccent: "shipped next.",
  summary: "Six quick questions, about two minutes. We'll come back with a plan, a timeline and an estimate.",
  services: [
    { title: "Answer six questions", description: "Scope, stage, timeline and budget, no forms to wrestle." },
    { title: "Get a plan back", description: "A Picode lead replies within one business day." },
  ],
  accent: "#0D9488",
  preview: "both",
  url: "/contact",
  logo: "",
  desktopImage: "",
  mobileImage: "",
  published: true,
  order: 9999,
};

function Heading() {
  return (
    <>
      <Eyebrow center>Case studies</Eyebrow>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:mt-4 lg:text-[2.75rem] lg:leading-tight">
        From servers to <span className="text-gradient-primary">shipped products</span>
      </h2>
    </>
  );
}

export function CaseStudiesShowcase({ studies }: { studies: CaseStudy[] }) {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && (
        <div className="hidden lg:block">
          <Pinned studies={studies} />
        </div>
      )}
      <div className={cn(!reduce && "lg:hidden")}>
        <Stacked studies={studies} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pinned stage (desktop)                                               */
/* ------------------------------------------------------------------ */

function Pinned({ studies: published }: { studies: CaseStudy[] }) {
  const studies = useMemo(() => [...published, NEXT_UP], [published]);
  const N = studies.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const stops = useMemo(() => studies.map((_, i) => i - PAD / 2), [studies]);
  // Projects switch as the visitor scrolls over the stage (or clicks the dock) — no timer.
  const auto = useAutoplay(trackRef, { stops, travel: 1.1, autoplay: false });
  const stageRef = useRef<HTMLDivElement>(null);
  const wheel = useWheelSteps(auto, [stageRef], { hintKey: "work" });
  /** Continuous project position. Integer = a project centred. */
  const pos = auto.value;

  // The stage grows as it scrolls into view.
  const { scrollYProgress: enter } = useScroll({ target: trackRef, offset: ["start end", "start start"] });
  const enterScale = useTransform(enter, [0.2, 1], [0.86, 1]);
  const enterRadius = useTransform(enter, [0.2, 1], [64, 32]);

  // Pointer tilt, shared by every layer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const tiltY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 20 });
  const tiltX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 20 });
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const [active, setActive] = useState(0);
  useMotionValueEvent(pos, "change", (v) => {
    const i = Math.min(N - 1, Math.max(0, Math.round(v)));
    setActive((prev) => (prev === i ? prev : i));
  });

  const goTo = (i: number) => auto.go(i);

  return (
    <div ref={trackRef} className="relative bg-surface-muted">
      <div className="flex h-[calc(100svh-4rem)] max-h-[1000px] min-h-[680px] flex-col pb-5 pt-20">
        <Container className="relative z-10 flex flex-col items-center text-center">
          <Heading />
        </Container>

        <motion.div
          ref={stageRef}
          onPointerMove={onMove}
          onPointerEnter={auto.hoverProps.onPointerEnter}
          onPointerLeave={(e) => {
            onLeave();
            auto.hoverProps.onPointerLeave(e);
          }}
          onFocus={auto.hoverProps.onFocus}
          onBlur={auto.hoverProps.onBlur}
          className="relative mx-auto mt-6 w-[calc(100%-2.5rem)] min-h-0 max-w-[1500px] flex-1 overflow-hidden shadow-[0_40px_100px_-40px_rgba(15,23,42,0.5)] xl:w-[calc(100%-4rem)]"
          style={{ scale: enterScale, borderRadius: enterRadius }}
        >
          {studies.map((s, i) => (
            <Layer key={s.id} study={s} index={i} total={N} pos={pos} tiltX={tiltX} tiltY={tiltY} />
          ))}

          <ScrollHint show={wheel.hover || wheel.peek} index={active} count={N} noun="project" className="inset-x-0 bottom-6" />

          {/* project dock */}
          <div className="absolute inset-x-0 top-5 z-30 flex justify-center">
            <div
              role="tablist"
              aria-label="Case studies"
              className="flex gap-1 rounded-full border border-white/20 bg-black/15 p-1.5 backdrop-blur-md"
            >
              {studies.map((s, i) => {
                const on = i === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => goTo(i)}
                    className={cn(
                      "relative overflow-hidden whitespace-nowrap rounded-full px-4 py-1.5 font-display text-[0.8125rem] font-medium transition-colors duration-300",
                      on ? "" : "text-white/70 hover:text-white",
                    )}
                    style={on ? { color: mix(s.accent, 85) } : undefined}
                  >
                    {on && (
                      <motion.span
                        layoutId="case-dock"
                        className="absolute inset-0 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {s.id === NEXT_ID && <Plus className="size-3.5" aria-hidden />}
                      {s.id === NEXT_ID ? "Yours" : s.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** One project's full-bleed stage; revealed by a circular wipe as the previous one finishes. */
function Layer({
  study,
  index,
  total,
  pos,
  tiltX,
  tiltY,
}: {
  study: CaseStudy;
  index: number;
  total: number;
  pos: MotionValue<number>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
}) {
  const local = useTransform(pos, (v) => v - index);
  const clipPath = useTransform(local, [-0.5, -0.1], ["circle(0% at 50% 108%)", "circle(150% at 50% 108%)"]);
  // Hidden while not yet revealed, and once the next stage fully covers it.
  const visibility = useTransform(local, (v) =>
    (index > 0 && v < -0.5) || (index < total - 1 && v > 0.92) ? "hidden" : "visible",
  );
  return (
    <motion.div
      className="absolute inset-0"
      style={{ clipPath: index === 0 ? undefined : clipPath, visibility, zIndex: index }}
    >
      <Stage study={study} index={index} total={total} local={local} tiltX={tiltX} tiltY={tiltY} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Stage                                                                */
/* ------------------------------------------------------------------ */

type Point = [x: number, y: number];
type Note = { chip: Point; from: Point; to: Point };

/** Where the "what we did" annotations float and which part of the screen they point at (% of the device box). */
const NOTES: Record<PreviewKind, [Note, Note]> = {
  both: [
    { chip: [58, -9], from: [64, 6], to: [38, 30] },
    { chip: [-6, 82], from: [10, 84], to: [30, 64] },
  ],
  web: [
    { chip: [62, -7], from: [70, 8], to: [44, 32] },
    { chip: [-5, 84], from: [10, 86], to: [28, 70] },
  ],
  mobile: [
    { chip: [83, 10], from: [83, 18], to: [64, 24] },
    { chip: [83, 60], from: [83, 68], to: [66, 56] },
  ],
};

function Stage({
  study,
  index,
  total,
  local,
  tiltX,
  tiltY,
  compact,
}: {
  study: CaseStudy;
  index: number;
  total: number;
  local: MotionValue<number>;
  tiltX?: MotionValue<number>;
  tiltY?: MotionValue<number>;
  compact?: boolean;
}) {
  const a = study.accent;
  const nameX = useTransform(local, [-0.6, 0.6], ["6%", "-26%"]);
  const devY = useTransform(local, [-0.5, -0.12, 0.4, 0.7], [110, 0, 0, -30]);
  const copyY = useTransform(local, [-0.5, -0.15], [60, 0]);
  const notesIn = useTransform(local, [-0.28, -0.04], [0, 1]);

  const style: CSSProperties = {
    background: `radial-gradient(70% 80% at 85% 0%, ${mix(a, 70, "white")} 0%, transparent 55%), radial-gradient(60% 70% at 0% 100%, ${mix(a, 55)} 0%, transparent 70%), linear-gradient(150deg, ${mix(a, 92)} 0%, ${mix(a, 62)} 100%)`,
  };
  const lightAccent = mix(a, 30, "white");

  return (
    <div className={cn("relative isolate h-full overflow-hidden text-white", compact && "rounded-3xl")} style={style}>
      {/* texture */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_70%_40%,black_10%,transparent_70%)]"
      />
      {/* kinetic name */}
      <motion.p
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 -z-10 select-none whitespace-nowrap font-display font-bold leading-none tracking-[-0.05em] text-transparent",
          compact ? "bottom-[30%] text-[30vw]" : "bottom-[-3%] text-[15vw]",
        )}
        style={{ x: compact ? 0 : nameX, WebkitTextStroke: "1.5px rgba(255,255,255,0.16)" }}
      >
        {study.name} · {study.name}
      </motion.p>

      {compact ? (
        <div className="relative flex flex-col gap-6 p-5 sm:p-8">
          <StageMeta study={study} index={index} total={total} />
          <div className="relative px-2">
            <DeviceBox study={study} local={local} />
          </div>
          <StageCopy study={study} lightAccent={lightAccent} />
          <div className="grid gap-3 sm:grid-cols-2">
            {study.services.slice(0, 2).map((s, i) => (
              <NoteChip key={s.title} n={i + 1} title={s.title} description={s.description} />
            ))}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 grid grid-cols-[0.78fr_1.22fr] gap-6 px-10 pb-10 pt-6 xl:gap-10 xl:px-14 xl:pb-12">
          {/* copy */}
          <motion.div className="flex min-h-0 flex-col justify-between" style={{ y: copyY }}>
            <StageMeta study={study} index={index} total={total} />
            <StageCopy study={study} lightAccent={lightAccent} />
          </motion.div>

          {/* devices + annotations */}
          <div className="relative flex min-h-0 items-center justify-center pt-16 [perspective:1400px]">
            <motion.div
              className="relative aspect-[16/12] h-full max-h-full w-auto max-w-full [transform-style:preserve-3d]"
              style={{ y: devY, rotateX: tiltX, rotateY: tiltY }}
            >
              <DeviceBox study={study} local={local} />
              <Notes study={study} progress={notesIn} />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

function StageMeta({ study, index, total }: { study: CaseStudy; index: number; total: number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {study.id === NEXT_ID ? (
          <span className="inline-flex items-center gap-2 font-display text-lg font-semibold text-white">
            <span className="inline-flex size-7 items-center justify-center rounded-lg border border-dashed border-white/60" aria-hidden>
              <Plus className="size-4" />
            </span>
            {study.name}
          </span>
        ) : (
          <ProjectMark study={study} invert className="text-lg text-white" />
        )}
        <p className="mt-3 flex items-center gap-2.5 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/70">
          <span className="h-px w-6 bg-white/50" aria-hidden />
          {study.category}
        </p>
      </div>
      <p className="font-display text-sm font-medium tabular-nums text-white/60 lg:hidden">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
    </div>
  );
}

function StageCopy({ study, lightAccent }: { study: CaseStudy; lightAccent: string }) {
  return (
    <div>
      <h3 className="font-display text-[clamp(2.2rem,1rem+2.8vw+1vh,4.2rem)] font-semibold leading-[0.98] tracking-[-0.045em] !text-white">
        {study.headline}
        {study.headlineAccent && (
          <>
            <br />
            <span style={{ color: lightAccent }}>{study.headlineAccent}</span>
          </>
        )}
      </h3>
      <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/75">{study.summary}</p>
      {study.id === NEXT_ID ? (
        <a
          href="/contact"
          className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-display text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ color: mix(study.accent, 85) }}
        >
          Start your brief
          <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
        </a>
      ) : (
        study.url && (
          <a
            href={study.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ color: mix(study.accent, 85) }}
          >
            Visit live site
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </a>
        )
      )}
    </div>
  );
}

/** Browser + phone (or two phones) inside a 16:12 box; screens scroll with the stage. */
function DeviceBox({ study, local }: { study: CaseStudy; local: MotionValue<number> }) {
  const webScroll = useTransform(local, [-0.25, 0.4], [0, 1]);
  const phoneScroll = useTransform(local, [-0.25, 0.4], [0, 0.6]);
  const phoneY = useTransform(local, [-0.6, 0.6], [50, -40]);
  const backY = useTransform(local, [-0.6, 0.6], [20, -15]);
  const web = study.preview !== "mobile";
  const phone = study.preview !== "web";

  if (study.id === NEXT_ID) return <BlueprintDevices phoneY={phoneY} />;

  return (
    <div className="relative aspect-[16/12] w-full [transform-style:preserve-3d]">
      {study.preview === "mobile" ? (
        <>
          <motion.div className="absolute left-[12%] top-[8%] w-[31%] -rotate-[6deg]" style={{ y: backY }}>
            <PhoneFrame study={study} progress={phoneScroll} variant={1} />
          </motion.div>
          <motion.div className="absolute left-[45%] top-[2%] w-[34%] rotate-[3deg]" style={{ y: phoneY }}>
            <PhoneFrame study={study} progress={phoneScroll} />
          </motion.div>
        </>
      ) : (
        <>
          {web && (
            <div className={cn("absolute top-[6%]", phone ? "left-0 w-[84%]" : "inset-x-0")}>
              <BrowserFrame study={study} progress={webScroll} className="!border-white/20" />
            </div>
          )}
          {phone && (
            <motion.div className="absolute bottom-[1%] right-0 w-[27%]" style={{ y: phoneY }}>
              <PhoneFrame study={study} progress={phoneScroll} />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

/** Wireframe "blueprint" devices for the closing stage: the product that doesn't exist yet. */
function BlueprintDevices({ phoneY }: { phoneY: MotionValue<number> }) {
  const shimmer =
    "relative overflow-hidden rounded-md bg-white/[0.12] after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer-x_2.4s_ease-in-out_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent";
  return (
    <div className="relative aspect-[16/12] w-full">
      <div className="absolute left-0 top-[6%] w-[84%] rounded-2xl border-2 border-dashed border-white/55 bg-white/[0.04] backdrop-blur-[2px]">
        <div className="flex h-8 items-center gap-1.5 border-b-2 border-dashed border-white/30 px-3">
          <span className="size-2 rounded-full border border-white/60" />
          <span className="size-2 rounded-full border border-white/60" />
          <span className="size-2 rounded-full border border-white/60" />
          <span className="mx-auto flex items-center rounded-md bg-white/10 px-3 py-0.5 font-mono text-[0.6875rem] text-white/80">
            your-idea.com<span className="ml-px animate-pulse">|</span>
          </span>
        </div>
        <div className="grid aspect-[16/10] grid-cols-[1.1fr_1fr] gap-[4%] p-[5%]">
          <div className="flex flex-col justify-center gap-[6%]">
            <span className={cn(shimmer, "h-[9%] w-1/3 rounded-full")} />
            <span className={cn(shimmer, "h-[16%] w-[90%]")} />
            <span className={cn(shimmer, "h-[16%] w-[70%]")} />
            <span className={cn(shimmer, "h-[6%] w-[80%] rounded-full")} />
            <span className="mt-[4%] h-[12%] w-[38%] rounded-full border-2 border-dashed border-white/60" />
          </div>
          <div className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-white/40">
            <motion.span
              className="flex size-14 items-center justify-center rounded-full bg-white/15 text-white"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Plus className="size-7" aria-hidden />
            </motion.span>
          </div>
        </div>
      </div>
      <motion.div className="absolute bottom-[1%] right-0 w-[27%]" style={{ y: phoneY }}>
        <div className="relative aspect-[9/19.5] rounded-[18%/8.3%] border-2 border-dashed border-white/60 bg-white/[0.05] p-[8%] backdrop-blur-[2px]">
          <span className="absolute left-1/2 top-[3%] h-[3%] w-[30%] -translate-x-1/2 rounded-full border border-white/50" />
          <div className="mt-[22%] flex flex-col gap-[5%]">
            <span className={cn(shimmer, "aspect-[16/9] w-full rounded-xl")} />
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn(shimmer, "h-3 rounded-full")} style={{ width: `${90 - i * 12}%` }} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Glass "what we did" annotations wired to the screen. */
function Notes({ study, progress }: { study: CaseStudy; progress: MotionValue<number> }) {
  const notes = NOTES[study.preview];
  const services = study.services.slice(0, 2);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Lines are drawn in real pixels so the draw-on animation stays a clean, continuous stroke.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry!.contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const X = (v: number) => (v / 100) * size.w;
  const Y = (v: number) => (v / 100) * size.h;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
      {size.w > 0 && (
        <svg className="absolute inset-0 overflow-visible" width={size.w} height={size.h} aria-hidden>
          {services.map((_, i) => {
            const n = notes[i]!;
            return (
              <motion.path
                key={i}
                d={`M ${X(n.from[0])} ${Y(n.from[1])} L ${X(n.to[0])} ${Y(n.to[1])}`}
                fill="none"
                stroke="white"
                strokeOpacity={0.85}
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{ pathLength: progress }}
              />
            );
          })}
        </svg>
      )}
      {services.map((s, i) => {
        const n = notes[i]!;
        return (
          <NoteOnStage key={s.title} note={n} progress={progress} delay={i * 0.15}>
            <NoteChip n={i + 1} title={s.title} description={s.description} />
          </NoteOnStage>
        );
      })}
    </div>
  );
}

function NoteOnStage({
  note,
  progress,
  delay,
  children,
}: {
  note: Note;
  progress: MotionValue<number>;
  delay: number;
  children: React.ReactNode;
}) {
  const opacity = useTransform(progress, [delay, delay + 0.6], [0, 1]);
  const scale = useTransform(progress, [delay, delay + 0.6], [0.85, 1]);
  const dot = useTransform(progress, [0.75, 1], [0, 1]);
  return (
    <>
      {/* target marker */}
      <motion.span
        className="absolute -ml-2 -mt-2 flex size-4 items-center justify-center"
        style={{ left: `${note.to[0]}%`, top: `${note.to[1]}%`, scale: dot }}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-white/60" />
        <span className="relative size-2.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.35)]" />
      </motion.span>
      <motion.div
        className="absolute w-[clamp(10rem,14vw,13.5rem)]"
        style={{ left: `${note.chip[0]}%`, top: `${note.chip[1]}%`, opacity, scale }}
      >
        {children}
      </motion.div>
    </>
  );
}

function NoteChip({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/[0.14] p-3.5 text-left shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <p className="flex items-center gap-2 font-display text-[0.8125rem] font-semibold leading-snug text-white">
        <span className="font-mono text-[0.625rem] text-white/60">{String(n).padStart(2, "0")}</span>
        {title}
      </p>
      <p className="mt-1 line-clamp-2 text-[0.6875rem] leading-relaxed text-white/75">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stacked (mobile / reduced motion)                                    */
/* ------------------------------------------------------------------ */

function Stacked({ studies }: { studies: CaseStudy[] }) {
  return (
    <div className="bg-surface-muted py-20 sm:py-24">
      <Container className="text-center">
        <Heading />
      </Container>
      <Container className="mt-12 space-y-6">
        {studies.map((s, i) => (
          <StackedCard key={s.id} study={s} index={i} total={studies.length} />
        ))}
      </Container>
    </div>
  );
}

function StackedCard({ study, index, total }: { study: CaseStudy; index: number; total: number }) {
  const local = useMotionValue(0);
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="shadow-float"
    >
      <Stage study={study} index={index} total={total} local={local} compact />
    </motion.article>
  );
}
