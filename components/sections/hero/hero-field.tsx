"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive dot field behind the hero.
 * Dots near the cursor swell and take on the brand gradient; a slow diagonal
 * "scan" wave keeps it alive when idle. Pure 2D canvas, ~2k dots.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const section = canvas.parentElement!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const GAP = 26;
    const RADIUS = 170;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    // Colours are read from CSS variables so the field follows the theme.
    let base = [209, 213, 219];
    const primary = [45, 212, 191];
    const secondary = [56, 189, 248];
    const readTheme = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--gray-300").trim().split(/\s+/).map(Number);
      if (v.length === 3 && v.every((n) => !Number.isNaN(n))) base = v;
    };
    readTheme();
    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const resize = () => {
      const r = section.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0); // static frame when motion is reduced
    };

    const draw = (time: number) => {
      // Ease the pointer for a soft, trailing spotlight.
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      ctx.clearRect(0, 0, w, h);

      const wave = reduce ? -1 : ((time / 1000) * 140) % (w + h + 600) - 300;

      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = Math.max(0, 1 - d / RADIUS); // 0..1
          const waveDist = Math.abs(x + y - wave);
          const glow = reduce ? 0 : Math.max(0, 1 - waveDist / 120) * 0.55;
          const k = Math.max(near, glow);

          // Push dots slightly away from the cursor for a "lens" feel.
          const push = near * near * 10;
          const px = x + (d > 0 ? (dx / d) * push : 0);
          const py = y + (d > 0 ? (dy / d) * push : 0);

          const mix = Math.min(1, (x / w) * 1.1); // primary → secondary across the width
          const r = primary[0]! + (secondary[0]! - primary[0]!) * mix;
          const g = primary[1]! + (secondary[1]! - primary[1]!) * mix;
          const b = primary[2]! + (secondary[2]! - primary[2]!) * mix;
          const cr = base[0]! + (r - base[0]!) * k;
          const cg = base[1]! + (g - base[1]!) * k;
          const cb = base[2]! + (b - base[2]!) * k;

          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.45 + k * 0.55})`;
          ctx.beginPath();
          ctx.arc(px, py, 1 + k * 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Soft spotlight
      if (pointer.x > -1000) {
        const grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, RADIUS * 1.6);
        grad.addColorStop(0, "rgba(45,212,191,0.10)");
        grad.addColorStop(1, "rgba(45,212,191,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(pointer.x - RADIUS * 2, pointer.y - RADIUS * 2, RADIUS * 4, RADIUS * 4);
      }
    };

    const loop = (time: number) => {
      if (visible) draw(time);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      pointer.tx = e.clientX - r.left;
      pointer.ty = e.clientY - r.top;
      if (pointer.x < -1000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    };
    const onLeave = () => {
      pointer.tx = pointer.ty = -9999;
      pointer.x = pointer.y = -9999;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(section);
    const io = new IntersectionObserver(([entry]) => (visible = Boolean(entry?.isIntersecting)));
    io.observe(section);

    if (reduce) {
      draw(0);
    } else {
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_85%_75%_at_50%_40%,black_35%,transparent)]"
    />
  );
}
