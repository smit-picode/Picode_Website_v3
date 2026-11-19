"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { MousePointerClick } from "lucide-react";

// three.js is only downloaded when this section is about to be seen.
const NeuralCore = dynamic(() => import("@/components/three/neural-core"), {
  ssr: false,
  loading: () => <CorePlaceholder />,
});

function CorePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="size-1/2 animate-pulse rounded-full bg-glow-brand opacity-40" />
    </div>
  );
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function NeuralCoreStage() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: "400px" });
  const visible = useInView(ref, { margin: "100px" });
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => setWebgl(supportsWebGL()), []);

  return (
    <div ref={ref} className="relative aspect-square w-full">
      {/* Ambient glow behind the canvas */}
      <div aria-hidden className="absolute inset-[8%] bg-glow-brand opacity-30 dark:opacity-40" />

      {near && webgl ? (
        <NeuralCore dark={resolvedTheme === "dark"} active={visible && !reduce} />
      ) : (
        <CorePlaceholder />
      )}

      {webgl && (
        <p className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-gray-200/70 bg-surface/70 px-3 py-1.5 text-[0.6875rem] font-medium text-gray-500 backdrop-blur">
          <MousePointerClick className="size-3.5 text-primary-strong" aria-hidden />
          Drag to rotate · click to send a pulse
        </p>
      )}
    </div>
  );
}
