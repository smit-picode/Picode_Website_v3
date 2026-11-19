"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight, Check, Play, Quote, X } from "lucide-react";
import { Tilt } from "@/components/motion/primitives";
import { SampleBadge } from "@/components/ui/section";
import { OfferingVisualArt } from "@/components/visuals/offering-visual";
import { deliveryProcess } from "@/lib/content/company";
import { offerings } from "@/lib/content/offerings";
import type { Testimonial } from "@/lib/content/work";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Scroll-lit statement: words brighten as you scroll through          */
/* ------------------------------------------------------------------ */
export function ScrollRevealText({ text, highlight = [] }: { text: string; highlight?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className="flex flex-wrap font-display text-[clamp(1.75rem,1rem+2.6vw,3.25rem)] font-medium leading-[1.2] tracking-tight">
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} accent={highlight.includes(w.replace(/[.,]/g, ""))}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range, accent }: { children: string; progress: MotionValue<number>; range: [number, number]; accent: boolean }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [8, 0]);
  return (
    <motion.span style={{ opacity, y }} className={cn("mr-[0.28em]", accent && "text-gradient-ai")}>
      {children}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Stacked sticky offering cards                                       */
/* ------------------------------------------------------------------ */
export function StackedOfferings() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className="relative">
      {offerings.map((o, i) => (
        <OfferingCard key={o.slug} i={i} total={offerings.length} progress={scrollYProgress} />
      ))}
    </div>
  );
}

function OfferingCard({ i, total, progress }: { i: number; total: number; progress: MotionValue<number> }) {
  const o = offerings[i]!;
  const reduce = useReducedMotion();
  const start = i / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - i - 1) * 0.045]);
  const filter = useTransform(progress, [start, Math.min(1, start + 1 / total)], ["brightness(1)", i === total - 1 ? "brightness(1)" : "brightness(0.7)"]);

  // RGB glitch burst each time the card lands in view, and on hover. It runs
  // on an inner wrapper so it never fights the scroll scale/brightness above.
  const cardRef = useRef<HTMLElement>(null);
  const inView = useInView(cardRef, { amount: 0.55 });
  const glitchRef = useRef<HTMLDivElement>(null);
  const lastBurst = useRef(0);
  const glitch = () => {
    const el = glitchRef.current;
    const now = Date.now();
    if (!el || reduce || now - lastBurst.current < 900) return;
    lastBurst.current = now;
    // Restart the CSS animation without remounting (keeps the diagram's own animation running).
    el.classList.remove("glitch-burst");
    void el.offsetWidth;
    el.classList.add("glitch-burst");
  };
  useEffect(() => {
    if (inView) glitch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div className="sticky top-24 flex min-h-[calc(100svh-7rem)] items-center py-6" style={{ zIndex: i + 1 }}>
      <motion.article
        ref={cardRef}
        onPointerEnter={glitch}
        style={reduce ? undefined : { scale, filter, top: `${i * 18}px` }}
        className="relative w-full origin-top overflow-hidden rounded-[2rem] border border-gray-200/70 bg-surface shadow-float"
      >
        <div aria-hidden className="absolute -right-32 -top-32 size-96 rounded-full opacity-25" style={{ background: `radial-gradient(closest-side, rgb(${o.accent.rgb}), transparent)` }} />
        <div
          ref={glitchRef}
          onAnimationEnd={(e) => e.target === e.currentTarget && e.currentTarget.classList.remove("glitch-burst")}
          className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-12 lg:p-14"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-gray-400">{o.index} / 0{total}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
            <div className={cn("mt-8 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-glow", o.accent.from, o.accent.to)}>
              <o.icon className="size-7" strokeWidth={1.6} aria-hidden />
            </div>
            <h3 className="mt-6 font-display text-[clamp(1.6rem,1.1rem+1.6vw,2.5rem)] font-semibold leading-tight tracking-tight">{o.title}</h3>
            <p className="mt-4 text-body-md text-gray-500">{o.summary}</p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {o.capabilities.slice(0, 4).map((c) => (
                <li key={c.title} className="flex gap-2.5 text-sm text-gray-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {c.title}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-primary-strong">Business value</p>
              <p className="mt-1.5 text-sm font-medium text-gray-800">{o.value}</p>
            </div>
            <Link
              href={`/services/${o.slug}`}
              className="group mt-8 inline-flex items-center gap-2 self-start font-display text-sm font-semibold text-gray-900"
            >
              Explore {o.shortTitle}
              <span className="inline-flex size-8 items-center justify-center rounded-full border border-gray-200 transition-all group-hover:border-transparent group-hover:bg-gradient-primary group-hover:text-white">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>
          <div className="relative flex items-center">
            <div className="hud-frame relative w-full rounded-2xl border border-gray-200/60 bg-surface-muted/60 p-4 sm:p-6">
              <OfferingVisualArt kind={o.visual} />
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Count-up number                                                     */
/* ------------------------------------------------------------------ */
export function CountUp({ to, suffix = "", prefix = "", decimals = 0 }: { to: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Delivery process with a scroll-drawn line                           */
/* ------------------------------------------------------------------ */
export function ProcessTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <ol ref={ref} className="relative grid gap-8 md:grid-cols-5 md:gap-4">
      <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-gray-200 md:block" />
      <motion.div aria-hidden style={{ scaleX }} className="absolute left-0 right-0 top-7 hidden h-px origin-left bg-gradient-to-r from-primary via-secondary to-tertiary md:block" />
      {deliveryProcess.map((s, i) => (
        <motion.li
          key={s.step}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: i * 0.12, duration: 0.6 }}
          className="relative"
        >
          <span className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-gray-200 bg-surface shadow-soft">
            <s.icon className="size-6 text-secondary" strokeWidth={1.6} aria-hidden />
          </span>
          <p className="mt-5 font-mono text-xs text-gray-400">{s.step}</p>
          <h3 className="mt-1 text-h3">{s.title}</h3>
          <p className="mt-2 text-sm text-gray-500">{s.body}</p>
        </motion.li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Happy-customer video reviews                                        */
/* ------------------------------------------------------------------ */
function isEmbed(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

export function VideoTestimonials({ items }: { items: Testimonial[] }) {
  const [open, setOpen] = useState<Testimonial | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.12, duration: 0.7 }}
          >
            <Tilt max={6} className="group h-full rounded-3xl">
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200/70 bg-surface">
                <button
                  type="button"
                  onClick={() => setOpen(t)}
                  className="relative aspect-video w-full overflow-hidden text-left"
                  aria-label={`Play video review from ${t.role}, ${t.company}`}
                >
                  {/* Generated poster */}
                  <div
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                    style={{
                      background:
                        t.poster
                          ? `center/cover url(${t.poster})`
                          : `radial-gradient(circle at ${30 + i * 20}% 30%, rgb(var(--color-secondary) / 0.55), transparent 55%), radial-gradient(circle at 80% 80%, rgb(var(--color-tertiary) / 0.5), transparent 50%), rgb(var(--color-dark))`,
                    }}
                  />
                  <div className="scanlines absolute inset-0 opacity-60" />
                  <span className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="rounded-full bg-black/40 px-2.5 py-1 font-mono text-[0.625rem] text-white backdrop-blur">
                      ● {t.duration ?? "video"}
                    </span>
                    {t.sample && <SampleBadge />}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="relative flex size-16 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/20" />
                      <Play className="ml-1 size-6 fill-white" aria-hidden />
                    </span>
                  </span>
                  <span className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white/90">
                    {t.role} · {t.company}
                  </span>
                </button>
                <div className="flex flex-1 flex-col p-6">
                  <Quote className="size-6 text-secondary/60" aria-hidden />
                  <p className="mt-3 flex-1 text-body-sm text-gray-700">&ldquo;{t.quote}&rdquo;</p>
                </div>
              </article>
            </Tilt>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Customer video review"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close video"
              >
                <X className="size-5" />
              </button>
              <div className="aspect-video">
                {open.videoUrl ? (
                  isEmbed(open.videoUrl) ? (
                    <iframe src={open.videoUrl} title={`${open.role} review`} className="size-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  ) : (
                    <video src={open.videoUrl} poster={open.poster} controls autoPlay className="size-full" />
                  )
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center text-white">
                    <Quote className="size-10 text-secondary" aria-hidden />
                    <p className="max-w-xl font-display text-xl">&ldquo;{open.quote}&rdquo;</p>
                    <p className="font-mono text-xs uppercase tracking-widest text-white/50">Video review coming soon</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
