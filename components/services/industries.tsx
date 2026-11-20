"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, X } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { useScrollActiveIntoView } from "@/components/motion/use-scroll-active-into-view";
import { Container, Eyebrow } from "@/components/ui/container";
import { useServicesContent } from "@/components/services/content-context";
import { cn } from "@/lib/utils";


export function IndustriesExplorer() {
  const { industries, services } = useServicesContent();
  const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));
  const [activeId, setActiveId] = useState(industries[0]?.id ?? "");
  // Phones/tablets: the industry rail scrolls sideways; bring the chosen one fully into view.
  const railRef = useRef<HTMLDivElement>(null);
  useScrollActiveIntoView(railRef, [activeId]);
  const ind = industries.find((i) => i.id === activeId) ?? industries[0];
  if (!ind) return null;
  const Icon = ind.icon;

  return (
    <section id="industries" className="relative scroll-mt-20 overflow-hidden py-20 lg:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-surface-muted to-transparent" />
      <Container>
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow>Industries</Eyebrow>
            <h2 className="mt-5 text-display-3">
              Deep in your industry, <span className="text-gradient-primary">fluent in its rules.</span>
            </h2>
          </div>
          <p className="text-body-md text-gray-500 lg:col-span-5">
            Every sector has its own regulations, users and edge cases. We bring patterns that already work, and adapt
            them to how your business really runs.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[19rem_1fr] xl:grid-cols-[21rem_1fr]">
          {/* industry rail: a typographic list */}
          <div
            ref={railRef}
            className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto border-b border-gray-200 px-4 lg:mx-0 lg:block lg:overflow-visible lg:border-b-0 lg:border-t lg:border-gray-900/80 lg:px-0 dark:lg:border-gray-300"
            role="tablist"
            aria-label="Industries"
          >
            {industries.map((i, k) => {
              const on = i.id === activeId;
              return (
                <button
                  key={i.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveId(i.id)}
                  onMouseEnter={() => setActiveId(i.id)}
                  className="group relative flex shrink-0 items-baseline gap-3 py-3 text-left lg:w-full lg:border-b lg:border-gray-200 lg:py-4"
                >
                  <span className="font-mono text-xs tabular-nums transition-colors" style={{ color: on ? i.accent : undefined }}>
                    <span className={on ? "" : "text-gray-400"}>{String(k + 1).padStart(2, "0")}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block whitespace-nowrap font-display text-base font-semibold transition-[color,transform] duration-300 lg:text-lg",
                        on ? "text-gray-900 lg:translate-x-1" : "text-gray-500 group-hover:text-gray-800",
                      )}
                    >
                      {i.name}
                    </span>
                    <span className="hidden text-xs text-gray-400 lg:block">{i.kicker}</span>
                  </span>
                  {on && (
                    <motion.span
                      layoutId="ind-bar"
                      className="absolute inset-x-0 bottom-0 h-0.5 lg:inset-x-auto lg:inset-y-3 lg:-left-4 lg:h-auto lg:w-0.5"
                      style={{ background: i.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* industry panel */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200/90 bg-surface shadow-float">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={ind.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* banner */}
                <div className="relative isolate overflow-hidden px-6 py-8 text-white sm:px-9" style={{ background: `linear-gradient(120deg, ${ind.accent}, color-mix(in oklab, ${ind.accent} 55%, #0b1220))` }}>
                  <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
                  <Icon aria-hidden className="absolute -right-6 -top-6 -z-10 size-48 text-white/10" strokeWidth={1} />
                  <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-xl">
                      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-white/70">{ind.kicker}</p>
                      <h3 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{ind.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">{ind.intro}</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                      <p className="font-display text-2xl font-bold">{ind.metric.value}</p>
                      <p className="text-xs text-white/80">{ind.metric.label}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[0.85fr_1.15fr]">
                  <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">The challenge</p>
                    <ul className="mt-4 space-y-3">
                      {ind.challenges.map((c) => (
                        <li key={c} className="flex gap-3 text-sm text-gray-700">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                            <X className="size-3" aria-hidden />
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-8 font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Built with in mind</p>
                    <ul className="mt-3 grid grid-cols-2 gap-2">
                      {ind.standards.map((st) => (
                        <li key={st} className="flex items-center gap-2 rounded-xl border border-gray-200/80 px-3 py-2 text-xs font-medium text-gray-700">
                          <ShieldCheck className="size-3.5 shrink-0" style={{ color: ind.accent }} aria-hidden />
                          {st}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">What we build</p>
                    <ul className="mt-4 border-t border-gray-200">
                      {ind.solutions.map((sol, k) => {
                        const svc = serviceById[sol.service]!;
                        return (
                          <motion.li key={sol.text} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + k * 0.06 }}>
                            <a href={`#${svc.id}`} className="group flex items-start gap-4 border-b border-gray-200 py-4">
                              <span className="pt-0.5 font-mono text-xs tabular-nums" style={{ color: ind.accent }}>
                                {svc.number}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[0.9375rem] font-medium leading-snug text-gray-900 transition-colors group-hover:text-primary-strong">{sol.text}</span>
                                <span className="mt-0.5 block text-xs text-gray-500">{svc.short}</span>
                              </span>
                              <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-gray-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-strong" aria-hidden />
                            </a>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}
