import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/primitives";
import { Container, Eyebrow } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/** Eyebrow → display heading → lead paragraph. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Reveal className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-6 text-display-3 font-semibold">{title}</h2>
      {description && (
        <p className={cn("mt-6 text-body-md text-gray-500", align === "center" && "mx-auto max-w-2xl")}>
          {description}
        </p>
      )}
      {children}
    </Reveal>
  );
}

/** Ambient background used behind page heroes and feature sections. */
export function AuroraBackdrop({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-blueprint [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      <div
        className="absolute -left-[10%] -top-[30%] size-[60rem] animate-aurora rounded-full bg-glow-primary"
        style={{ opacity: 0.16 * intensity }}
      />
      <div
        className="absolute -right-[15%] -top-[10%] size-[50rem] animate-aurora rounded-full bg-glow-secondary [--aurora-duration:28s] [animation-direction:reverse]"
        style={{ opacity: 0.14 * intensity }}
      />
      <div
        className="absolute bottom-[-40%] left-1/3 size-[46rem] animate-aurora rounded-full [--aurora-duration:34s]"
        style={{
          opacity: 0.12 * intensity,
          background: "radial-gradient(closest-side, rgb(var(--color-tertiary)), transparent)",
        }}
      />
    </div>
  );
}

/** Hero block for inner pages. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="noise relative isolate overflow-hidden pb-20 pt-36 sm:pt-40 lg:pb-28">
      <AuroraBackdrop />
      <Container className={cn("grid items-center gap-12", aside && "lg:grid-cols-12")}>
        <Reveal className={cn(aside ? "lg:col-span-7" : "max-w-4xl")}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-7 text-display-2 font-semibold">{title}</h1>
          {description && <p className="mt-7 max-w-2xl text-body-lg text-gray-500">{description}</p>}
          {children}
        </Reveal>
        {aside && <div className="relative lg:col-span-5">{aside}</div>}
      </Container>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
    </section>
  );
}

/** Visible marker for placeholder content that must be replaced before launch. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      title="Illustrative content. Replace with an approved client story before launch"
      className={cn(
        "inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-warning ring-1 ring-inset ring-warning/30",
        className,
      )}
    >
      Sample
    </span>
  );
}

/** Mono, HUD-style label. */
export function HudLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-secondary-strong", className)}>
      <span aria-hidden className="opacity-60">{"// "}</span>
      {children}
    </span>
  );
}
