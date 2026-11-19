"use client";

import { useReducedMotion } from "framer-motion";
import { ServiceFlow } from "@/components/services/service-flow";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/container";
import { industries } from "@/lib/content/services";
import { cn } from "@/lib/utils";

/**
 * Hero: the headline on the left and, on the right, a light motion graphic of scattered
 * work flowing through AI into four clean outcomes.
 */
export function ServicesHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden pt-32 sm:pt-36 lg:pt-40">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] size-[46rem] rounded-full bg-[radial-gradient(closest-side,rgb(var(--color-primary)/0.14),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-surface-muted" />
      </div>

      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          {/* headline */}
          <Reveal className="lg:col-span-5">
            <Eyebrow>Services</Eyebrow>
            <h1 className="mt-6 text-display-2 !leading-[1.03]">
              Engineering that moves the <span className="text-gradient-primary">business forward.</span>
            </h1>
            <p className="mt-6 max-w-md text-body-md text-gray-500">
              We modernize what you have, build what you need, automate how you work and help you see what is coming.
              AI is part of every step, and senior engineers own every outcome.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/#contact" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Start a project
              </ButtonLink>
              <ButtonLink href="#industries" variant="outline" size="lg" rightIcon={<ArrowDown className="size-4" aria-hidden />}>
                Industries
              </ButtonLink>
            </div>
          </Reveal>

          {/* animated service showcase */}
          <Reveal delay={0.1} className="lg:col-span-7">
            <ServiceFlow />
          </Reveal>
        </div>
      </Container>

      {/* industries ticker */}
      <div className="mt-16 border-y border-gray-200 py-5 lg:mt-24">
        <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className={cn("flex w-max items-center", !reduce && "animate-marquee [--marquee-duration:50s]")}>
            {[...industries, ...industries].map((ind, k) => (
              <span
                key={k}
                aria-hidden={k >= industries.length}
                className="flex items-center gap-10 whitespace-nowrap pr-10 font-display text-lg font-medium text-gray-400 sm:text-xl"
              >
                {ind.name}
                <span className="size-1.5 rounded-full bg-gradient-primary" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

