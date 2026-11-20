"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useTheme } from "next-themes";
import { ScrollHint, useAutoplay, useWheelSteps } from "@/components/motion/autoplay";
import { TechStackExplorer, type TechCategory } from "@/components/sections/tech-stack-explorer";
import { Callouts } from "@/components/sections/tech-stack-3d/callouts";
import type { TrackStore } from "@/components/sections/tech-stack-3d/scene";
import { Container, Eyebrow } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * Self-playing 3D story of how a product is built, one technology layer per scene:
 *   1 Frontend  — a website scrolls on a desktop
 *   2 Mobile    — the camera pushes into the screen, a phone emerges and zooms out
 *   3 AI & ML   — chatting with an AI assistant on the phone
 *   4 Backend   — the phone explodes into 3D layers; the backend board lights up
 *   5 Cloud     — signals shoot up from the backend into the cloud
 *   6 Data      — the cloud streams signals down into the servers
 * Rendered with three.js (studio lighting, real shadows, reflections). Each scene's
 * tools float around it as glossy glass tiles.
 */

// three.js is only downloaded when the section is about to be seen.
const TechScene = dynamic(() => import("@/components/sections/tech-stack-3d/scene"), {
  ssr: false,
  loading: () => null,
});

function StagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
      <div aria-hidden className="absolute h-1/2 w-2/3 rounded-[2rem] bg-glow-brand opacity-15 blur-2xl" />
      <div className="relative flex flex-col items-center gap-4">
        <span className="relative size-12">
          <span className="absolute inset-0 rounded-full border-2 border-gray-200" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-secondary" />
        </span>
        <span className="font-display text-sm font-medium text-gray-500">Loading 3D scene…</span>
      </div>
    </div>
  );
}

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

const SCENES = ["frontend", "mobile", "ai", "backend", "cloud", "data"] as const;
const N = SCENES.length;
/** Story progress (0–1) where each category's animation has settled — the autoplay stops. */
const SETTLE = [0.07, 0.25, 0.42, 0.58, 0.75, 0.95];

type P = MotionValue<number>;

/* ------------------------------------------------------------------ */
/* Entry                                                                */
/* ------------------------------------------------------------------ */

function Heading() {
  return (
    <>
      <Eyebrow center>Our tech stack</Eyebrow>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:mt-4 lg:text-[2.75rem] lg:leading-tight">
        From pixels to <span className="text-gradient-primary">servers</span>
      </h2>
    </>
  );
}

export function TechStackStory({ categories }: { categories: TechCategory[] }) {
  const reduce = useReducedMotion();
  const [webgl, setWebgl] = useState(true);
  useEffect(() => setWebgl(supportsWebGL()), []);
  const ordered = SCENES.map((id) => categories.find((c) => c.id === id)).filter(Boolean) as TechCategory[];

  if (reduce || !webgl || ordered.length !== N) {
    return (
      <div className="py-24 lg:py-32">
        <Container className="text-center">
          <Heading />
        </Container>
        <Container className="mt-12">
          <TechStackExplorer categories={categories} />
        </Container>
      </div>
    );
  }
  return <Story scenes={ordered} />;
}

function Story({ scenes }: { scenes: TechCategory[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Plays scene by scene while on screen; the 3D transitions run between the settle points.
  const auto = useAutoplay(trackRef, { stops: SETTLE, initial: 0, hold: 5, travel: 3.4, wrap: "rewind" });
  const p = auto.value;
  // Scrolling over the 3D stage steps through the layers.
  const stageRef = useRef<HTMLDivElement>(null);
  // Wheel over the stage scrubs the story in real time (~650px of scrolling per layer);
  // tab clicks and autoplay glide between layers with the long transition above.
  const wheel = useWheelSteps(auto, [stageRef], { hintKey: "tech", scrub: 0.88 / (5 * 650) });
  const [active, setActive] = useState(0);
  const near = useInView(trackRef, { once: true, margin: "600px" });
  const visible = useInView(trackRef, { margin: "100px" });
  const { resolvedTheme } = useTheme();
  const track = useRef<TrackStore>({ scene: 0, points: [] });
  const [ready, setReady] = useState(false);

  const dark = resolvedTheme === "dark";
  // Matches --color-surface-muted in each theme so the 3D studio dissolves into the section.
  const background = dark ? "rgb(9, 14, 25)" : "rgb(242, 245, 249)"; // = --color-surface-muted

  useMotionValueEvent(p, "change", (v) => {
    const i = Math.min(N - 1, Math.max(0, Math.floor(v * N)));
    setActive((prev) => (prev === i ? prev : i));
  });

  const goTo = (i: number) => auto.go(i);

  const scene = scenes[active]!;

  return (
    <div ref={trackRef} data-tech-story className="relative">
      <div className="flex h-[100svh] max-h-[1000px] min-h-[680px] flex-col pb-4 pt-20 sm:pt-24">
        {/* Title + scene tabs */}
        <Container className="relative z-20 flex flex-col items-center text-center">
          <Heading />

          <div className="no-scrollbar -mx-4 mt-5 max-w-[calc(100%+2rem)] overflow-x-auto px-4 pb-1 lg:mt-6">
            <div
              role="tablist"
              aria-label="Technology layers"
              className="mx-auto flex w-max gap-1 rounded-full border border-gray-200/80 bg-surface/80 p-1.5 shadow-soft backdrop-blur"
            >
              {scenes.map((s, i) => {
                const on = i === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => goTo(i)}
                    className={cn(
                      "relative overflow-hidden whitespace-nowrap rounded-full px-3.5 py-2 font-display text-[0.8125rem] font-medium transition-colors duration-300 sm:px-4",
                      on ? "text-white" : "text-gray-500 hover:text-gray-900",
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId="story-tab"
                        className="absolute inset-0 rounded-full bg-gradient-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      />
                    )}
                    {on && <TabProgress p={auto.holdProgress} />}
                    <span className="relative">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative mt-3 h-10 w-full max-w-xl sm:h-6">
            {/* Keyed remount + fade-in: never gets stuck when scenes change quickly. */}
            <motion.p
              key={scene.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 text-sm text-gray-500"
            >
              {scene.blurb}
            </motion.p>
          </div>
        </Container>

        {/* Stage */}
        <div ref={stageRef} {...auto.hoverProps} className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,black_86%,transparent)]">
          {near ? (
            <>
              <TechScene
                progress={p}
                track={track}
                active={visible}
                background={background}
                dark={dark}
                onReady={() => setReady(true)}
              />
              {ready && <Callouts key={scene.id} category={scene} sceneIndex={active} track={track} />}
            </>
          ) : null}
          <ScrollHint show={wheel.hover || wheel.peek} index={active} count={N} noun="layer" className="inset-x-0 bottom-[16%]" />
          {/* Loader until the 3D scene has downloaded and drawn its first frames */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-700",
              ready ? "opacity-0" : "opacity-100",
            )}
          >
            <StagePlaceholder />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabProgress({ p }: { p: P }) {
  return (
    <motion.span
      aria-hidden
      style={{ scaleX: p }}
      className="absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-white/70"
    />
  );
}
