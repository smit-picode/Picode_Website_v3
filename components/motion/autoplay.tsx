"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Time-driven stepper for the homepage "stories" (offerings, AI lifecycle, tech stack,
 * case studies). Replaces scroll-pinning: the page scrolls normally and each section
 * advances on its own while it's on screen.
 *
 *  - `value` moves between `stops` (one per step) — sections derive their animation from it
 *    exactly like they used to from scroll progress.
 *  - Pauses while hovered/focused, off-screen, or when the visitor presses pause.
 *  - `go(i)` jumps to a step (tabs, prev/next); the timer restarts from there.
 */
export type Autoplay = {
  value: MotionValue<number>;
  /** 0→1 through the current step's hold — drives progress bars. */
  holdProgress: MotionValue<number>;
  index: number;
  count: number;
  playing: boolean;
  paused: boolean;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
  togglePause: () => void;
  /** Spread on the area that should pause autoplay while the visitor is using it. */
  hoverProps: {
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onFocus: () => void;
    onBlur: (e: React.FocusEvent) => void;
  };
};

type Options = {
  stops: number[];
  /** Seconds spent on each step. */
  hold?: number;
  /** Seconds to move between steps. */
  travel?: number;
  /** While holding, glide linearly from the stop to stop + drift (keeps scenes alive). */
  drift?: number;
  /** After the last step: jump straight back, or animate back to the first stop. */
  wrap?: "jump" | "rewind";
  /** Starting value (defaults to the first stop); the first step animates in from it. */
  initial?: number;
};

const EASE = [0.65, 0, 0.35, 1] as const;

export function useAutoplay(ref: RefObject<HTMLElement>, opts: Options): Autoplay {
  const { stops, hold = 5, travel = 0.9, drift = 0, wrap = "jump" } = opts;
  const count = stops.length;
  const reduce = useReducedMotion();
  const value = useMotionValue(opts.initial ?? stops[0]!);
  const holdProgress = useMotionValue(0);
  const inView = useInView(ref, { amount: 0.35 });

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const playing = Boolean(!paused && !hovered && inView && !reduce);

  const idx = useRef(0);
  const elapsed = useRef(0);
  const moving = useRef(false);
  const ctrl = useRef<AnimationPlaybackControls | null>(null);
  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  const go = useCallback(
    (i: number, how: "travel" | "jump" | "rewind" = "travel") => {
      const n = stopsRef.current.length;
      const target = ((i % n) + n) % n;
      ctrl.current?.stop();
      idx.current = target;
      elapsed.current = 0;
      holdProgress.set(0);
      setIndex(target);
      const to = stopsRef.current[target]!;
      if (how === "jump" || reduce) {
        moving.current = false;
        value.set(to);
        return;
      }
      moving.current = true;
      const duration = how === "rewind" ? Math.min(2.4, travel * 1.6) : travel;
      ctrl.current = animate(value, to, { duration, ease: EASE });
      void ctrl.current.then(() => {
        if (idx.current === target) moving.current = false;
      });
    },
    [holdProgress, reduce, travel, value],
  );

  // First step animates in from `initial`.
  useEffect(() => {
    if (opts.initial !== undefined && opts.initial !== stops[0]) go(0);
    return () => ctrl.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The clock: only ticks while playing and not mid-transition.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Real time, even on slow frames; capped so a long stall (e.g. a background tab) doesn't skip steps.
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      if (!moving.current) {
        elapsed.current += dt;
        const t = Math.min(1, elapsed.current / hold);
        holdProgress.set(t);
        if (drift) value.set(stopsRef.current[idx.current]! + drift * t);
        if (elapsed.current >= hold) {
          const nextI = idx.current + 1;
          if (nextI >= stopsRef.current.length) go(0, wrap === "rewind" ? "rewind" : "jump");
          else go(nextI);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, hold, drift, wrap, go, holdProgress, value]);

  return {
    value,
    holdProgress,
    index,
    count,
    playing,
    paused,
    go: (i) => go(i),
    next: () => go(idx.current + 1 >= count ? 0 : idx.current + 1, idx.current + 1 >= count && wrap === "rewind" ? "rewind" : "travel"),
    prev: () => go(idx.current - 1 < 0 ? count - 1 : idx.current - 1),
    togglePause: () => setPaused((p) => !p),
    hoverProps: {
      onPointerEnter: (e) => e.pointerType === "mouse" && setHovered(true),
      onPointerLeave: () => setHovered(false),
      onFocus: () => setHovered(true),
      onBlur: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false);
      },
    },
  };
}

/** Prev / pause / next pill with a step counter and a progress bar for the current step. */
export function AutoplayControls({
  auto,
  label,
  className,
  tone = "light",
}: {
  auto: Autoplay;
  /** What a step is called, for screen readers: "offering", "stage"… */
  label: string;
  className?: string;
  tone?: "light" | "glass";
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const btn = cn(
    "inline-flex size-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    tone === "glass" ? "text-white/85 hover:bg-white/15 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border p-1 shadow-soft",
        tone === "glass" ? "border-white/20 bg-black/20 text-white backdrop-blur-md" : "border-gray-200/90 bg-surface",
        className,
      )}
    >
      <button type="button" onClick={auto.prev} className={btn} aria-label={`Previous ${label}`}>
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={auto.togglePause}
        className={btn}
        aria-label={auto.paused ? "Play automatically" : "Pause"}
        aria-pressed={auto.paused}
        title={auto.paused ? "Play" : "Pause"}
      >
        {auto.paused ? <Play className="size-3.5 fill-current" aria-hidden /> : <Pause className="size-3.5 fill-current" aria-hidden />}
      </button>
      <span className="flex flex-col items-center gap-1 px-2">
        <span
          className={cn("font-display text-xs font-semibold tabular-nums", tone === "glass" ? "text-white" : "text-gray-700")}
          aria-live="polite"
        >
          {pad(auto.index + 1)} <span className={tone === "glass" ? "text-white/50" : "text-gray-400"}>/ {pad(auto.count)}</span>
        </span>
        <span className={cn("h-0.5 w-12 overflow-hidden rounded-full", tone === "glass" ? "bg-white/20" : "bg-gray-200")}>
          <motion.span
            className={cn("block h-full origin-left rounded-full", tone === "glass" ? "bg-white" : "bg-gradient-primary")}
            style={{ scaleX: auto.holdProgress }}
          />
        </span>
      </span>
      <button type="button" onClick={auto.next} className={btn} aria-label={`Next ${label}`}>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}
