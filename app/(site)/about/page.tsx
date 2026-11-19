import type { Metadata } from "next";
import { CtaBand, WhyPicodeSection } from "@/components/home/sections";
import { ScrollRevealText } from "@/components/home/interactive";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { NeuralCoreStage } from "@/components/three/neural-core-stage";
import { Container } from "@/components/ui/container";
import { HudLabel, PageHero, SectionHeading } from "@/components/ui/section";
import { PhoneFrame } from "@/components/visuals/video-frames";
import { companyValues } from "@/lib/content/company";
import { aboutClip } from "@/lib/content/media";
import { offerings } from "@/lib/content/offerings";
import { getOffices } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "About Picode",
  description: "Picode is a modern software engineering company specialising in intelligent, data-driven web and mobile applications.",
};

export default async function AboutPage() {
  const offices = await getOffices();
  return (
    <>
      <PageHero
        eyebrow="About Picode"
        title={<>We engineer the <span className="text-gradient-ai">intelligent core</span> of modern businesses</>}
        description="Picode is a software engineering company specialising in intelligent, data-driven web and mobile applications. We help organisations modernise what they have, build what they need and automate what slows them down."
        aside={<NeuralCoreStage />}
      />

      <section className="py-24 lg:py-32">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <HudLabel>Our mission</HudLabel>
          </div>
          <div className="lg:col-span-6">
            <ScrollRevealText
              text="To make intelligent software practical for every business: engineered around real problems, delivered with craft, and measured by the value it creates."
              highlight={["intelligent", "software", "value"]}
            />
          </div>
          <Reveal className="flex justify-center lg:col-span-3 lg:justify-end">
            <PhoneFrame clip={aboutClip} className="rotate-2" />
          </Reveal>
        </Container>
      </section>

      <section className="bg-surface-muted/60 py-20 lg:py-28">
        <Container>
          <SectionHeading eyebrow="What we do" title={<>Four offerings, <span className="text-gradient-ai">one focus: outcomes</span></>} />
          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {offerings.map((o) => (
              <StaggerItem key={o.slug}>
                <div className="h-full rounded-3xl border border-gray-200/70 bg-surface p-7">
                  <o.icon className="size-7 text-secondary" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-5 text-h3">{o.shortTitle}</h3>
                  <p className="mt-2 text-body-sm text-gray-500">{o.tagline}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <SectionHeading eyebrow="Our values" title={<>What we <span className="text-gradient-ai">stand for</span></>} />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-gray-200/70 bg-gray-200/70 sm:grid-cols-2">
            {companyValues.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08} className="bg-surface p-8 sm:p-10">
                <span className="font-mono text-sm text-secondary-strong">0{i + 1}</span>
                <h3 className="mt-4 font-display text-2xl font-semibold">{v.title}</h3>
                <p className="mt-2 text-body-sm text-gray-500">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <WhyPicodeSection />

      <section className="pb-20">
        <Container>
          <HudLabel>Where we are</HudLabel>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offices.map((o) => (
              <div key={o.id} className="rounded-2xl border border-gray-200/70 bg-surface p-6">
                <p className="font-display text-xl font-semibold">{o.city}</p>
                <p className="text-sm text-gray-500">{o.country}{o.label ? ` · ${o.label}` : ""}</p>
                <p className="mt-3 text-sm text-gray-600">{o.address}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
