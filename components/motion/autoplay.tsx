"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Stepper for the homepage "stories" (offerings, AI lifecycle, tech stack, case studies).
 * No scroll-pinning: the page scrolls normally, and
 *  - each section advances on its own while it's on screen (unless `autoplay: false`),
 *  - scrolling the wheel over its stage steps through it (see useWheelSteps),
 *  - `go(i)` jumps to a step (tabs); the timer restarts from there.
 *
 * `value` moves between `stops` (one per step) — sections derive their animation from it
 * exactly like they used to from scroll progress. Pauses while hovered/focused or off-screen.
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
  /** True while moving between steps (wheel steps wait for it, so transitions never get cut short). */
  isMoving: () => boolean;
  /** Scrub: move the value by `delta` right now (wheel-driven, follows the scroll in real time). */
  nudge: (delta: number) => { value: number; atStart: boolean; atEnd: boolean };
  /** Where the value is heading (scrub target or current value). */
  position: () => number;
  bounds: () => [number, number];
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
  /** Advance on a timer (default). false = steps only change on scroll / tab clicks. */
  autoplay?: boolean;
};

const EASE = [0.65, 0, 0.35, 1] as const;

export function useAutoplay(ref: RefObject<HTMLElement>, opts: Options): Autoplay {
  const { stops, hold = 5, travel = 0.9, drift = 0, wrap = "jump", autoplay = true } = opts;
  const count = stops.length;
  const reduce = useReducedMotion();
  const value = useMotionValue(opts.initial ?? stops[0]!);
  const holdProgress = useMotionValue(0);
  const inView = useInView(ref, { amount: 0.35 });

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const playing = Boolean(autoplay && !paused && !hovered && inView && !reduce);

  const idx = useRef(0);
  const scrubTarget = useRef<number | null>(null);
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
      scrubTarget.current = null;
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
      const duration = how === "rewind" ? Math.min(4, travel * 1.3) : travel;
      ctrl.current = animate(value, to, { duration, ease: EASE });
      void ctrl.current.then(() => {
        if (idx.current === target) moving.current = false;
      });
    },
    [holdProgress, reduce, travel, value],
  );

  // Scrub follower: every frame the value eases toward the wheel target (exponential
  // smoothing, like smooth-scroll libraries), so motion flows continuously between wheel
  // notches instead of stopping and starting.
  const followRaf = useRef(0);
  const startFollow = useCallback(() => {
    if (followRaf.current) return;
    let last = performance.now();
    const step = (now: number) => {
      const target = scrubTarget.current;
      if (target === null) {
        followRaf.current = 0;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const cur = value.get();
      const next = cur + (target - cur) * (1 - Math.exp(-dt / 0.14));
      if (Math.abs(target - next) < 1e-5) {
        value.set(target);
        followRaf.current = 0;
        return;
      }
      value.set(next);
      followRaf.current = requestAnimationFrame(step);
    };
    followRaf.current = requestAnimationFrame(step);
  }, [value]);
  useEffect(() => () => cancelAnimationFrame(followRaf.current), []);

  const nudge = useCallback(
    (delta: number) => {
      const st = stopsRef.current;
      const lo = st[0]!;
      const hi = st[st.length - 1]!;
      const from = scrubTarget.current ?? value.get();
      const to = Math.min(hi, Math.max(lo, from + delta));
      scrubTarget.current = to;
      ctrl.current?.stop();
      moving.current = false;
      if (reduce) value.set(to);
      else startFollow();
      // The step whose settle point is nearest becomes the "current" one (tabs, autoplay).
      let best = 0;
      st.forEach((s, i) => {
        if (Math.abs(s - to) < Math.abs(st[best]! - to)) best = i;
      });
      if (best !== idx.current) {
        idx.current = best;
        setIndex(best);
      }
      elapsed.current = 0;
      holdProgress.set(0);
      return { value: to, atStart: to <= lo + 1e-6, atEnd: to >= hi - 1e-6 };
    },
    [holdProgress, reduce, startFollow, value],
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
    isMoving: () => moving.current,
    nudge,
    position: () => scrubTarget.current ?? value.get(),
    bounds: () => [stopsRef.current[0]!, stopsRef.current[stopsRef.current.length - 1]!],
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

/**
 * Wheel over a story's stage steps through it instead of scrolling the page.
 *  - One gesture = one step. A gesture is a run of wheel events with no pause longer than
 *    `gapMs`, so a trackpad flick and its inertia tail never skip a stage; the next notch
 *    or flick (or reversing direction) moves on.
 *  - At the first/last step the wheel goes back to the page, so scrolling outside the
 *    stage, or past the ends, always scrolls normally.
 *  - Only engages once most of the stage is on screen.
 * Returns whether the pointer is over the stage, plus a one-time "peek" when the
 * section first comes into view — both drive <ScrollHint>.
 */
export function useWheelSteps(
  auto: Autoplay,
  areas: RefObject<HTMLElement>[],
  {
    gapMs = 180,
    releaseMs = 1200,
    hintKey,
    scrub,
  }: {
    gapMs?: number;
    releaseMs?: number;
    hintKey?: string;
    /** Real-time mode: each wheel pixel moves the value by this much (no stepping). */
    scrub?: number;
  } = {},
) {
  const state = useRef({ index: auto.index, count: auto.count, go: auto.go, isMoving: auto.isMoving, auto });
  state.current = { index: auto.index, count: auto.count, go: auto.go, isMoving: auto.isMoving, auto };
  const [hover, setHover] = useState(false);
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    const els = areas.map((r) => r.current).filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    let lastEvent = 0;
    let lastStep = -Infinity;
    let stepped = false; // this gesture already moved a step
    let stepDir = 0;
    let acc = 0;
    let idx = state.current.index;

    const swallow = (e: WheelEvent) => {
      e.preventDefault();
      (e as WheelEvent & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const vh = window.innerHeight;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible < Math.min(r.height, vh) * 0.7) return; // let the page bring it into view first

      const now = performance.now();
      const dir = e.deltaY > 0 ? 1 : -1;
      if (now - lastEvent > gapMs || (stepped && dir !== stepDir)) {
        // a new gesture: resync with any tab click / autoplay that happened meanwhile
        stepped = false;
        acc = 0;
        idx = state.current.index;
      }
      lastEvent = now;

      if (scrub) {
        const a = state.current.auto;
        const [lo, hi] = a.bounds();
        const v = a.position();
        const outward = (dir > 0 && v >= hi - 1e-6) || (dir < 0 && v <= lo + 1e-6);
        if (outward) {
          // Reached the end during this gesture: absorb its tail, then hand back to the page.
          if (stepped && now - lastStep < releaseMs) swallow(e);
          return;
        }
        swallow(e);
        const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * vh : e.deltaY;
        const r2 = a.nudge(px * scrub);
        if ((dir > 0 && r2.atEnd) || (dir < 0 && r2.atStart)) {
          stepped = true;
          lastStep = now;
        }
        return;
      }

      const { count, go } = state.current;
      const atEdge = (dir > 0 && idx >= count - 1) || (dir < 0 && idx <= 0);
      if (atEdge) {
        // Just arrived at the end: absorb the rest of that flick, then hand back to the page.
        if (stepped && now - lastStep < releaseMs) swallow(e);
        return;
      }

      swallow(e);
      if (stepped) return; // the rest of this gesture is spent
      if (state.current.isMoving()) return; // let the current transition finish smoothly
      acc += e.deltaY;
      if (Math.abs(acc) < 20) return;
      acc = 0;
      idx += dir;
      go(idx);
      lastStep = now;
      stepped = true;
      stepDir = dir;
    };

    const enter = (e: PointerEvent) => e.pointerType === "mouse" && setHover(true);
    const leave = (e: PointerEvent) => {
      if (!els.some((el) => el.contains(e.relatedTarget as Node | null))) setHover(false);
    };

    // First time the stage is properly on screen, briefly show how it works.
    let peekTimer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        try {
          if (hintKey && sessionStorage.getItem(`hint:${hintKey}`)) return;
          if (hintKey) sessionStorage.setItem(`hint:${hintKey}`, "1");
        } catch {
          /* storage blocked: still show it */
        }
        setPeek(true);
        peekTimer = window.setTimeout(() => setPeek(false), 4200);
      },
      { threshold: 0.6 },
    );
    io.observe(els[els.length - 1]!);

    els.forEach((el) => {
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
    });
    return () => {
      io.disconnect();
      window.clearTimeout(peekTimer);
      els.forEach((el) => {
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hover, peek };
}

/**
 * Floating guide for a wheel-steppable stage: an animated mouse, where you are, and
 * the escape hatch (scroll outside to keep moving down the page).
 */
export function ScrollHint({
  show,
  index,
  count,
  noun,
  className,
}: {
  show: boolean;
  index: number;
  count: number;
  noun: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const last = index >= count - 1;
  return (
    <div className={cn("pointer-events-none absolute z-30 flex justify-center", className)}>
    <AnimatePresence>
      {show && (
        <motion.div
          role="note"
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/90 py-2.5 pl-2.5 pr-4 text-white shadow-[0_18px_40px_-16px_rgba(2,6,23,0.6)] backdrop-blur-md"
        >
          {/* mouse with a rolling wheel */}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <span className="relative flex h-[18px] w-3 justify-center rounded-full border-[1.5px] border-white/80">
              <motion.span
                className="mt-[3px] h-1 w-[2px] rounded-full bg-teal-300"
                animate={reduce ? undefined : { y: [0, 5, 0], opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-[0.8125rem] font-semibold leading-tight">
              {last ? `That's the last ${noun}` : `Scroll here for the next ${noun}`}
            </span>
            <span className="mt-0.5 block text-[0.6875rem] leading-tight text-white/60">
              {last ? "Keep scrolling to continue down the page" : "Scroll outside this area to skip ahead"}
            </span>
          </span>
          <span className="ml-1 flex items-center gap-1" aria-label={`${index + 1} of ${count}`}>
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-4 bg-teal-300" : "w-1.5 bg-white/30")}
              />
            ))}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
