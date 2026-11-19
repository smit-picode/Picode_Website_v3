import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { JobList } from "@/components/careers/job-list";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { Container } from "@/components/ui/container";
import { HudLabel, PageHero, SectionHeading } from "@/components/ui/section";
import { companyValues, openings, perks } from "@/lib/content/company";
import { getSettings } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Careers",
  description: "Build intelligent applications with Picode. Explore open roles in engineering, AI and design.",
};

export default async function CareersPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title={<>Build what&apos;s <span className="text-gradient-ai">next</span> with us</>}
        description="Join a team of engineers, designers and AI builders shipping intelligent applications for real businesses. Modern stacks, meaningful problems and room to grow."
      />

      <section className="py-20 lg:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading eyebrow="Open roles" title={<>Current <span className="text-gradient-ai">openings</span></>} />
            <p className="font-mono text-sm text-gray-400">{openings.length} positions</p>
          </div>
          <JobList jobs={openings} careersEmail={settings.careersEmail} />
          <p className="mt-8 text-sm text-gray-500">
            Don&apos;t see your role? Send your CV to{" "}
            <a href={`mailto:${settings.careersEmail}`} className="font-medium text-secondary-strong hover:underline">{settings.careersEmail}</a>.
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted/60 py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <HudLabel>Life at Picode</HudLabel>
            <h2 className="mt-4 text-display-3 font-semibold">Why you&apos;ll love it here</h2>
            <Stagger className="mt-10 grid gap-3 sm:grid-cols-2">
              {perks.map((p) => (
                <StaggerItem key={p} className="flex gap-3 rounded-2xl border border-gray-200/70 bg-surface p-5 text-sm text-gray-700">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                  {p}
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <div>
            <HudLabel>How we work</HudLabel>
            <div className="mt-6 space-y-4">
              {companyValues.map((v) => (
                <Reveal key={v.title} className="rounded-2xl border border-gray-200/70 bg-surface p-6">
                  <h3 className="text-h3">{v.title}</h3>
                  <p className="mt-1.5 text-body-sm text-gray-500">{v.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
