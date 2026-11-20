import { ArrowRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { HeroField } from "@/components/sections/hero/hero-field";
import { HeroCopyScroll, StudioScroll } from "@/components/sections/hero/hero-motion";
import { VisionStudio } from "@/components/sections/hero/vision-studio";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const stats = [
  { value: "AI-first", label: "Delivery lifecycle" },
  { value: "End-to-end", label: "Strategy to scale" },
  { value: "Web · Mobile", label: "Cloud & data" },
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28 lg:pt-40">
      <HeroField />
      <div aria-hidden className="absolute -right-40 -top-40 -z-20 size-[52rem] bg-glow-secondary opacity-20" />
      <div aria-hidden className="absolute -left-32 top-40 -z-20 size-[36rem] bg-glow-primary opacity-15" />
      {/* melt into the grey offerings section below instead of a hard edge */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-surface-muted" />

      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <HeroCopyScroll className="min-w-0 lg:col-span-6">
          <Stagger trigger="mount" stagger={0.12} delayChildren={0.1}>
            <h1 className="text-display-1">
              <StaggerItem as="span" className="block">
                Your{" "}
                <span className="text-primary">Vision</span>
                ,
              </StaggerItem>
              <StaggerItem as="span" className="block">
                Our <span className="text-gradient-primary">Expertise</span>
              </StaggerItem>
            </h1>

            <StaggerItem>
              <p className="mt-7 max-w-xl text-body-lg text-gray-500">
                We build AI-native digital solutions to enable and accelerate your growth.{" "}
                <span className="text-gray-700">Tell us the problem — we&apos;ll design and build the solution →</span>
              </p>
            </StaggerItem>

            <StaggerItem className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href="/contact" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Start your project
              </ButtonLink>
              <ButtonLink href="/#offerings" size="lg" variant="outline">
                Explore services
              </ButtonLink>
            </StaggerItem>

            <StaggerItem>
              <dl className="mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-gray-100 pt-8 sm:gap-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="whitespace-nowrap font-display text-base font-semibold text-gray-900 min-[420px]:text-xl sm:text-2xl">
                      {s.value}
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500 sm:text-sm">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </StaggerItem>
          </Stagger>
        </HeroCopyScroll>

        <Stagger trigger="mount" delayChildren={0.35} className="relative min-w-0 lg:col-span-6">
          <StaggerItem>
            <StudioScroll>
              <VisionStudio />
            </StudioScroll>
          </StaggerItem>
        </Stagger>
      </Container>

      {/* Scroll cue */}
      <div aria-hidden className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block">
        <div className="flex h-10 w-6 justify-center rounded-full border border-gray-300 pt-2">
          <span className="h-2 w-1 animate-bounce rounded-full bg-gradient-primary" />
        </div>
      </div>
    </section>
  );
}
