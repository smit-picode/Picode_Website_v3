"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Plus } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/container";
import { engagements, faqs } from "@/lib/content/services";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* How to work with us                                                  */
/* ------------------------------------------------------------------ */

export function EngagementModels() {
  return (
    <section className="relative bg-surface-muted py-20 lg:py-28">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>Ways to work together</Eyebrow>
          <h2 className="mt-5 text-display-3">
            Start small, <span className="text-gradient-primary">scale with confidence.</span>
          </h2>
          <p className="mt-4 text-body-md text-gray-500">Pick the model that fits where you are today. Most clients start with a discovery sprint.</p>
        </Reveal>

        <div className="mt-14 border-t border-gray-900/80 dark:border-gray-300">
          {engagements.map((e, i) => (
            <motion.div
              key={e.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="group relative grid gap-4 border-b border-gray-200 py-8 transition-colors md:grid-cols-[4rem_1.1fr_1.4fr_1.2fr] md:gap-8 md:px-4"
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-gradient-primary transition-transform duration-500 group-hover:scale-y-100" />
              <span className="font-mono text-sm tabular-nums text-primary-strong">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="flex flex-wrap items-center gap-3 font-display text-xl font-semibold text-gray-900">
                  {e.name}
                  {e.featured && <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.18em] text-primary-strong">Most chosen</span>}
                </p>
                <p className="mt-1 font-mono text-xs text-gray-500">{e.duration}</p>
              </div>
              <p className="text-sm leading-relaxed text-gray-500 sm:text-base">{e.text}</p>
              <ul className="space-y-1.5">
                {e.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="size-4 shrink-0 text-primary-strong" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                  */
/* ------------------------------------------------------------------ */

export function ServicesFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20 lg:py-28">
      <Container className="grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-5 text-display-3">Questions we hear often</h2>
          <p className="mt-4 text-body-md text-gray-500">Something else on your mind? We reply within one business day.</p>
          <ButtonLink href="/#contact" variant="outline" className="mt-6" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
            Ask us anything
          </ButtonLink>
        </Reveal>
        <div className="divide-y divide-gray-200 border-y border-gray-200 lg:col-span-8">
          {faqs.map((f, i) => {
            const on = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className={cn("font-display text-base font-semibold transition-colors sm:text-lg", on ? "text-gray-900" : "text-gray-700")}>{f.q}</span>
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300", on ? "rotate-45 border-transparent bg-gradient-primary text-white" : "border-gray-200 text-gray-500")}>
                    <Plus className="size-4" aria-hidden />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 text-body-sm text-gray-500 sm:text-base">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing CTA                                                          */
/* ------------------------------------------------------------------ */

export function ServicesCta() {
  return (
    <section className="pb-24 lg:pb-32">
      <Container>
        <Reveal>
          <div
            className="relative isolate overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white sm:px-12 lg:py-20"
            style={{ background: "radial-gradient(120% 120% at 80% 0%, #3cc7b6, #0d9488 40%, #0b2f48)" }}
          >
            <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/70">Your project, next</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight !text-white sm:text-5xl">
              Tell us the problem. We&apos;ll come back with a plan.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">Six quick questions, about two minutes. A Picode lead replies within one business day.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/#contact" size="lg" className="!bg-none bg-white !text-gray-900 ![text-shadow:none] hover:bg-white/90" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Start your brief
              </ButtonLink>
              <ButtonLink href="/#work" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                See our work
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
