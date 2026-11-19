import { ArrowLeft, Hammer, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Float, Stagger, StaggerItem } from "@/components/motion/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type PageUnderDevelopmentProps = {
  /** Human-readable name of the page, e.g. "Careers". */
  title?: string;
};

export function PageUnderDevelopment({ title }: PageUnderDevelopmentProps) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-20 pt-32">
      {/* Background: faint grid + brand glows */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid-faint bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/3 -z-10 size-[40rem] -translate-x-1/2 -translate-y-1/2 bg-glow-brand opacity-25"
      />

      <Container>
        <Stagger trigger="mount" className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <StaggerItem>
            <Float distance={12} duration={5} className="relative">
              <div className="glass relative flex size-28 items-center justify-center rounded-[2rem] shadow-float">
                <Logo variant="symbol" href={null} className="h-12" />
              </div>
              <Float
                distance={8}
                duration={3.5}
                delay={0.6}
                className="absolute -right-6 -top-4"
              >
                <span className="glass inline-flex size-10 items-center justify-center rounded-2xl text-primary-strong shadow-soft">
                  <Hammer className="size-4" aria-hidden />
                </span>
              </Float>
              <Float
                distance={6}
                duration={4.5}
                delay={1.2}
                className="absolute -bottom-3 -left-7"
              >
                <span className="glass inline-flex size-9 items-center justify-center rounded-xl text-secondary-strong shadow-soft">
                  <Sparkles className="size-4" aria-hidden />
                </span>
              </Float>
            </Float>
          </StaggerItem>

          <StaggerItem className="mt-12">
            <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary-strong">
              {title ?? "This page"}
            </span>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-4 text-display-3">
              Coming <span className="text-gradient-primary">Soon</span>
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-6 max-w-lg text-body-md text-gray-500">
              We&apos;re engineering something great here. This page is under active development —
              check back shortly, or head home to explore what we do.
            </p>
          </StaggerItem>

          <StaggerItem className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/" size="lg" leftIcon={<ArrowLeft className="size-4" aria-hidden />}>
              Back to Home
            </ButtonLink>
            <ButtonLink href="/#contact" size="lg" variant="outline">
              Contact us
            </ButtonLink>
          </StaggerItem>
        </Stagger>
      </Container>
    </section>
  );
}
