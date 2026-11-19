"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { SERVICE_STAGE as STAGE, ServiceScene } from "@/components/services/service-scenes";
import { Container, Eyebrow } from "@/components/ui/container";
import { services, type Service } from "@/lib/content/services";
import { cn } from "@/lib/utils";


export function ServiceChapters() {
  const [active, setActive] = useState(services[0]!.id);

  // Highlight the service whose chapter is in the middle of the viewport.
  useEffect(() => {
    const els = services.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="services" className="relative bg-surface-muted py-20 lg:py-28">
      <Container>
        <Reveal className="max-w-3xl">
          <Eyebrow>What we do</Eyebrow>
          <h2 className="mt-5 text-display-3">
            Core services, <span className="text-gradient-primary">built around outcomes.</span>
          </h2>
          <p className="mt-4 text-body-md text-gray-500">
            Each service can stand alone, but they work best together: modernize the core, build the experience,
            automate the work and measure what matters.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-14 xl:grid-cols-[17rem_1fr]">
          {/* sticky navigator */}
          <nav aria-label="Services" className="hidden lg:block">
            <ol className="sticky top-28 space-y-1 border-l border-gray-200">
              {services.map((s) => {
                const on = s.id === active;
                return (
                  <li key={s.id} className="relative">
                    {on && (
                      <motion.span layoutId="svc-rail" className="absolute -left-px top-0 h-full w-0.5 bg-gradient-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                    )}
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        "flex items-center gap-3 py-3 pl-5 pr-2 transition-colors",
                        on ? "text-gray-900" : "text-gray-500 hover:text-gray-900",
                      )}
                    >
                      <span className={cn("w-6 shrink-0 font-mono text-xs tabular-nums transition-colors", on ? "text-primary-strong" : "text-gray-400")}>{s.number}</span>
                      <span className="font-display text-[0.9375rem] font-semibold leading-snug">{s.short}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="space-y-24 lg:space-y-32">
            {services.map((s, i) => (
              <Chapter key={s.id} service={s} index={i} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Chapter({ service: s, index }: { service: Service; index: number }) {
  return (
    <article id={s.id} className="scroll-mt-28">
      {/* header */}
      <Reveal className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 right-0 select-none font-display text-[7rem] font-bold leading-none tracking-tighter text-transparent [-webkit-text-stroke:1.5px_rgb(var(--gray-200))] sm:text-[9rem]"
        >
          {s.number}
        </span>
        <div className="relative flex items-center gap-3">
          <span className="h-[2px] w-10 rounded-full bg-gradient-primary" aria-hidden />
          <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-strong">Service {s.number}</span>
        </div>
        <h3 className="relative mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl">
          {s.title}
        </h3>
        <p className="relative mt-3 font-display text-lg font-medium text-primary-strong">{s.tagline}</p>
        <p className="relative mt-3 max-w-2xl text-body-md text-gray-500">{s.summary}</p>
      </Reveal>

      {/* stage */}
      <Reveal delay={0.05} className="mt-10">
        <div className="relative isolate flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[1.75rem] p-8 sm:min-h-[24rem]" style={{ background: STAGE[index % STAGE.length] }}>
          <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <p
            aria-hidden
            className="pointer-events-none absolute -bottom-6 left-4 -z-10 whitespace-nowrap font-display text-[7rem] font-bold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.1)]"
          >
            {s.short}
          </p>
          <span className="absolute left-6 top-5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-white/70">
            {s.number} / {s.short}
          </span>
          <ServiceScene id={s.id} />
        </div>
      </Reveal>

      {/* business value: a pull-quote and three outcomes */}
      <Reveal className="mt-12 grid gap-8 lg:grid-cols-[11rem_1fr] lg:gap-10">
        <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-gray-500 lg:items-start lg:pt-2">
          <TrendingUp className="size-4 text-primary-strong" aria-hidden /> Business value
        </p>
        <div>
          <blockquote className="relative pl-6 font-display text-xl font-medium leading-snug tracking-tight text-gray-900 sm:text-2xl">
            <span aria-hidden className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[3px] rounded-full bg-gradient-primary" />
            {s.value.headline}
          </blockquote>
          <dl className="mt-8 grid border-t border-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-gray-200">
            {s.value.outcomes.map((o) => (
              <div key={o.label} className="border-b border-gray-200 py-5 sm:border-b-0 sm:px-6 sm:first:pl-0">
                <dt className="font-display text-sm font-semibold text-gray-900">{o.label}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-gray-500">{o.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      {/* capabilities: an editorial numbered list */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[11rem_1fr] lg:gap-10">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-gray-500 lg:pt-6">Key capabilities</p>
        <div>
          <ol className="grid border-t border-gray-900/80 sm:grid-cols-2 sm:gap-x-10 dark:border-gray-300">
            {s.capabilities.map((c, k) => (
              <motion.li
                key={c.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: k * 0.05, duration: 0.45 }}
                className="group grid grid-cols-[2.5rem_1fr] gap-2 border-b border-gray-200 py-6"
              >
                <span className="font-mono text-sm tabular-nums text-primary-strong">{String(k + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block font-display text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary-strong">
                    {c.title}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-gray-500">{c.text}</span>
                </span>
              </motion.li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">Deliverables: </span>
              {s.deliverables.join(" · ")}
            </p>
            <a
              href="/#contact"
              className="group inline-flex items-center gap-2 font-display text-sm font-semibold text-primary-strong"
            >
              Discuss {s.short.toLowerCase()}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
