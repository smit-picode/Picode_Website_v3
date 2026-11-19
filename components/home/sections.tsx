import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import {
  CountUp,
  ProcessTimeline,
  ScrollRevealText,
  StackedOfferings,
  VideoTestimonials,
} from "@/components/home/interactive";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { AuroraBackdrop, HudLabel, SectionHeading } from "@/components/ui/section";
import { AcceleratorCard, CaseStudyCard } from "@/components/visuals/cards";
import { accelerators, differentiators, engagementModels } from "@/lib/content/company";
import { offerings } from "@/lib/content/offerings";
import { caseStudies, testimonials } from "@/lib/content/work";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
export function CapabilityMarquee() {
  const items = offerings.flatMap((o) => o.capabilities.map((c) => c.title));
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];
  return (
    <section aria-label="Capabilities" className="relative border-y border-gray-200/60 bg-surface-muted/50 py-6">
      <div className="mask-fade-x space-y-3 overflow-hidden">
        {rows.map((row, r) => (
          <div key={r} className="flex w-max">
            <div className={cn("flex shrink-0", r === 0 ? "animate-marquee" : "animate-marquee-reverse")} style={{ ["--marquee-duration" as string]: "60s" }}>
              {[...row, ...row].map((t, i) => (
                <span key={i} className="mx-2 inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-gray-200/70 bg-surface px-4 py-2 text-sm text-gray-600">
                  <span className="size-1.5 rounded-full bg-gradient-primary" aria-hidden />
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function ProblemStatement() {
  return (
    <section className="relative py-28 lg:py-40">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <HudLabel>Why we exist</HudLabel>
        </div>
        <div className="lg:col-span-9">
          <ScrollRevealText
            text="Most businesses don't need more technology. They need fewer manual steps, faster decisions, modern systems and products customers love. We engineer intelligent applications that deliver exactly that: measurable value, not just code."
            highlight={["intelligent", "applications", "measurable", "value"]}
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { k: "Problem", v: "Disconnected systems, manual work and data nobody can use." },
              { k: "Solution", v: "AI-enabled web, mobile and workflow applications built around your business." },
              { k: "Value", v: "Productivity, lower cost, faster launches and better decisions." },
            ].map((x, i) => (
              <Reveal key={x.k} delay={i * 0.1} className="rounded-2xl border border-gray-200/70 bg-surface/60 p-6 backdrop-blur">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-secondary-strong">0{i + 1} · {x.k}</p>
                <p className="mt-3 text-body-sm text-gray-700">{x.v}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function OfferingsSection() {
  return (
    <section id="offerings" className="relative scroll-mt-20 pb-16 pt-8">
      <Container>
        <SectionHeading
          eyebrow="Core offerings"
          title={<>Four ways we create <span className="text-gradient-ai">business value</span></>}
          description="Every engagement starts with a business problem. These are the four areas where we solve them best."
        />
        <div className="mt-12">
          <StackedOfferings />
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function ImpactBand() {
  const stats = [
    { to: 4, suffix: "", label: "Core offerings, one accountable team" },
    { to: 2, suffix: " wks", label: "Between working demos, every sprint" },
    { to: 40, suffix: "%", label: "Faster starts with our accelerators*" },
    { to: 24, suffix: "h", label: "To respond to every enquiry" },
  ];
  return (
    <section className="relative py-20">
      <Container>
        <div className="noise relative overflow-hidden rounded-[2rem] border border-gray-200/70 bg-surface p-8 sm:p-12">
          <AuroraBackdrop intensity={0.8} />
          <dl className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-5xl font-semibold tracking-tight text-gradient-ai sm:text-6xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </dd>
                <dt className="mt-3 text-sm text-gray-500">{s.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-xs text-gray-400">*Target time-to-first-release improvement with the Agentic Application Starter Kit.</p>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function AcceleratorsSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <Container>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Accelerators"
            title={<>Built once. <span className="text-gradient-ai">Reused to deliver faster.</span></>}
            description="Reusable foundations that demonstrate our engineering depth and cut weeks from every project."
          />
          <ButtonLink href="/accelerators" variant="outline" rightIcon={<ArrowUpRight className="size-4" aria-hidden />}>
            All accelerators
          </ButtonLink>
        </div>
        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {accelerators.map((a) => (
            <StaggerItem key={a.slug}>
              <AcceleratorCard a={a} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function CaseStudiesSection() {
  const [first, ...rest] = caseStudies;
  return (
    <section className="relative bg-surface-muted/60 py-24 lg:py-32">
      <Container>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Case studies"
            title={<>Problems solved. <span className="text-gradient-ai">Value proven.</span></>}
            description="Each story covers the business problem, what we built and the outcome it delivered."
          />
          <ButtonLink href="/work" variant="outline" rightIcon={<ArrowUpRight className="size-4" aria-hidden />}>
            View all work
          </ButtonLink>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {first && (
            <Reveal className="lg:row-span-2">
              <CaseStudyCard cs={first} featured />
            </Reveal>
          )}
          {rest.slice(0, 2).map((cs, i) => (
            <Reveal key={cs.slug} delay={0.1 * (i + 1)}>
              <CaseStudyCard cs={cs} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function TestimonialsSection() {
  return (
    <section className="relative py-24 lg:py-32">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Happy customers"
          title={<>Hear it from <span className="text-gradient-ai">the people we build for</span></>}
          description="Short video reviews from the teams whose work our software changed."
        />
        <div className="mt-14">
          <VideoTestimonials items={testimonials} />
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function EngagementSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <AuroraBackdrop intensity={0.6} />
      <Container>
        <SectionHeading
          eyebrow="How to engage"
          title={<>Work with us <span className="text-gradient-ai">your way</span></>}
          description="Three clear engagement models. Pick the one that fits your goals, budget and team."
        />
        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {engagementModels.map((m, i) => (
            <StaggerItem key={m.id}>
              <article
                className={cn(
                  "group relative flex h-full flex-col rounded-3xl border bg-surface p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-float",
                  i === 0 ? "border-secondary/40" : "border-gray-200/70",
                )}
              >
                {i === 0 && (
                  <span className="absolute -top-3 left-8 rounded-full bg-gradient-primary px-3 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
                <m.icon className="size-8 text-secondary" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-6 font-display text-xl font-semibold">{m.title}</h3>
                <p className="mt-3 text-body-sm text-gray-500">{m.summary}</p>
                <ul className="mt-6 space-y-2.5">
                  {m.includes.map((x) => (
                    <li key={x} className="flex gap-2.5 text-sm text-gray-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-8 font-mono text-xs uppercase tracking-wider text-gray-400">{m.commercial}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-24">
          <Reveal>
            <HudLabel>Our delivery process</HudLabel>
          </Reveal>
          <div className="mt-10">
            <ProcessTimeline />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function WhyPicodeSection() {
  return (
    <section className="relative py-24 lg:py-32">
      <Container className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              eyebrow="Why Picode"
              title={<>Engineering partners, <span className="text-gradient-ai">not just developers</span></>}
              description="We combine business understanding, AI-native engineering and reusable accelerators to deliver software that pays for itself."
            />
            <ButtonLink href="/about" variant="outline" className="mt-8" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
              About Picode
            </ButtonLink>
          </div>
        </div>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {differentiators.map((d, i) => (
            <StaggerItem key={d.title} className={cn(i === 0 && "sm:col-span-2")}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-gray-200/70 bg-surface p-7 transition-colors duration-500 hover:border-secondary/40">
                <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-glow-secondary opacity-0 transition-opacity duration-700 group-hover:opacity-20" />
                <d.icon className="relative size-7 text-secondary" strokeWidth={1.5} aria-hidden />
                <h3 className="relative mt-5 text-h3">{d.title}</h3>
                <p className="relative mt-2 text-body-sm text-gray-500">{d.body}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function CtaBand({
  title = "Have a business problem worth solving?",
  body = "Tell us where it hurts. We'll come back within 24 hours with ideas, an approach and next steps.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="relative py-20 lg:py-28">
      <Container>
        <Reveal>
          <div className="noise relative isolate overflow-hidden rounded-[2.5rem] bg-[#050A14] px-6 py-16 text-center sm:px-16 lg:py-24">
            <div aria-hidden className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(56_189_248/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(56_189_248/0.08)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
              <div className="absolute left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 animate-aurora rounded-full bg-glow-brand opacity-30" />
            </div>
            <h2 className="mx-auto max-w-3xl font-display text-[clamp(2rem,1.2rem+3vw,3.75rem)] font-semibold leading-tight tracking-tight text-white">
              {title}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-body-md text-[rgb(148_163_184)]">{body}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/contact" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Start a conversation
              </ButtonLink>
              <Link
                href="/engagement"
                className="inline-flex h-14 items-center rounded-full border border-white/20 px-8 font-display text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                See engagement models
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
