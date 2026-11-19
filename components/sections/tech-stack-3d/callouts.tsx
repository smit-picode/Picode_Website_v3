"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import { BrandIcon, type TechCategory } from "@/components/sections/tech-stack-explorer";
import type { TrackStore } from "@/components/sections/tech-stack-3d/scene";
import { cn } from "@/lib/utils";

/**
 * Motion-tracking callouts: each tool is a clean label in a side column, joined by a
 * thin leader line to a reticle that is locked onto a real point in the 3D scene and
 * follows it as the camera moves. Positions come from the scene every frame.
 */
export function Callouts({
  category,
  sceneIndex,
  track,
}: {
  category: TechCategory;
  sceneIndex: number;
  track: MutableRefObject<TrackStore>;
}) {
  const items = useMemo(() => category.items.slice(0, 8), [category]);
  const root = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const reticles = useRef<(HTMLDivElement | null)[]>([]);
  const coords = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = root.current;
      if (!el) return;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const store = track.current;
      const fresh = store.scene === sceneIndex;
      // read
      const boxes = labels.current.map((l) =>
        l ? { x: l.offsetLeft, y: l.offsetTop, w: l.offsetWidth, h: l.offsetHeight } : null,
      );
      // write
      items.forEach((_, i) => {
        const pt = store.points[i];
        const on = fresh && !!pt?.on;
        const box = boxes[i];
        const path = paths.current[i];
        const dot = dots.current[i];
        const ret = reticles.current[i];
        if (!path || !dot || !ret || !box) return;
        if (!on) {
          path.style.opacity = "0";
          dot.style.opacity = "0";
          ret.style.opacity = "0";
          return;
        }
        const ax = pt!.x * W;
        const ay = pt!.y * H;
        const left = i % 2 === 0;
        const sx = left ? box.x + box.w : box.x;
        const sy = box.y + box.h / 2;
        const elbow = left ? sx + 28 : sx - 28;
        path.setAttribute("d", `M ${sx} ${sy} H ${elbow} L ${ax} ${ay}`);
        path.style.opacity = "1";
        dot.setAttribute("cx", String(sx));
        dot.setAttribute("cy", String(sy));
        dot.style.opacity = "1";
        ret.style.opacity = "1";
        ret.style.transform = `translate(${ax}px, ${ay}px)`;
        const c = coords.current[i];
        if (c)
          c.textContent = `${String(Math.round(pt!.x * 1000)).padStart(3, "0")}·${String(Math.round(pt!.y * 1000)).padStart(3, "0")}`;
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [items, sceneIndex, track]);

  const leftRows = Math.ceil(items.length / 2);
  const rightRows = Math.floor(items.length / 2);
  const rowTop = (row: number, rows: number) => (rows <= 1 ? 44 : 8 + (row * 72) / (rows - 1));

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
      <svg className="absolute inset-0 size-full overflow-visible">
        {items.map((t, i) => (
          <g key={t.name}>
            <path
              ref={(el) => {
                paths.current[i] = el;
              }}
              fill="none"
              stroke="rgb(var(--color-primary-strong))"
              strokeOpacity={0.55}
              strokeWidth={1}
              strokeDasharray="3 3"
              style={{ opacity: 0, transition: "opacity .3s" }}
            />
            <circle
              ref={(el) => {
                dots.current[i] = el;
              }}
              r={2.5}
              fill="rgb(var(--color-primary-strong))"
              style={{ opacity: 0 }}
            />
          </g>
        ))}
      </svg>

      {/* reticles locked onto the scene */}
      {items.map((t, i) => (
        <div
          key={`r-${t.name}`}
          ref={(el) => {
            reticles.current[i] = el;
          }}
          className="absolute left-0 top-0"
          style={{ opacity: 0, transition: "opacity .25s" }}
        >
          <motion.div
            initial={{ scale: 2.6, rotate: 45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative -ml-[11px] -mt-[11px] size-[22px]"
          >
            {[
              "left-0 top-0 border-l border-t",
              "right-0 top-0 border-r border-t",
              "bottom-0 left-0 border-b border-l",
              "bottom-0 right-0 border-b border-r",
            ].map((c) => (
              <span key={c} className={cn("absolute size-1.5 border-primary-strong", c)} />
            ))}
            <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-strong" />
            <motion.span
              className="absolute inset-0 rounded-full border border-primary/60"
              animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
            />
          </motion.div>
        </div>
      ))}

      {/* labels */}
      {items.map((t, i) => {
        const left = i % 2 === 0;
        const row = Math.floor(i / 2);
        return (
          <motion.div
            key={`l-${t.name}`}
            ref={(el) => {
              labels.current[i] = el;
            }}
            initial={{ opacity: 0, x: left ? -16 : 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.25 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute flex w-[13.5rem] items-center gap-3 rounded-2xl border border-gray-200/70 bg-surface/80 px-3 py-2.5 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] backdrop-blur-md lg:w-[15rem]",
              left ? "left-[2.5%]" : "right-[2.5%] flex-row-reverse text-right",
            )}
            style={{ top: `${rowTop(row, left ? leftRows : rightRows)}%` }}
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ backgroundColor: `${t.hex}12`, borderColor: `${t.hex}30` }}
            >
              <BrandIcon tech={t} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-sm font-semibold text-gray-900">{t.name}</span>
              <span className="block truncate text-[0.6875rem] text-gray-500">{t.use}</span>
            </span>
            <span
              ref={(el) => {
                coords.current[i] = el;
              }}
              className="hidden shrink-0 font-mono text-[0.5625rem] tabular-nums text-primary-strong/70 xl:block"
            />
          </motion.div>
        );
      })}
    </div>
  );
}
