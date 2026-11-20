import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ApplyForm } from "@/components/careers/apply-form";
import { JobBoard } from "@/components/careers/job-board";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { Container, Eyebrow } from "@/components/ui/container";
import { HudLabel, PageHero, SectionHeading } from "@/components/ui/section";
import type { JobPost } from "@/lib/content/careers";
import { companyValues, perks } from "@/lib/content/company";
import { listJobs } from "@/lib/server/careers";
import { getPublicSettings } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Careers",
  description: "Build intelligent applications with Picode. Explore open roles in engineering, AI and design, or join our talent pool.",
};

// Job posts are managed in /admin, so always render the latest.
export const dynamic = "force-dynamic";

async function openJobs(): Promise<JobPost[]> {
  try {
    return await listJobs({ publishedOnly: true });
  } catch (error) {
    console.error("[careers] Could not load jobs:", error);
    return [];
  }
}

export default async function CareersPage() {
  const [settings, jobs] = await Promise.all([getPublicSettings(), openJobs()]);
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title={<>Build what&apos;s <span className="text-gradient-ai">next</span> with us</>}
        description="Join a team of engineers, designers and AI builders shipping intelligent applications for real businesses. Modern stacks, meaningful problems and room to grow."
      />

      <section id="openings" className="scroll-mt-24 py-20 lg:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading eyebrow="Open roles" title={<>Current <span className="text-gradient-ai">openings</span></>} />
            <p className="font-mono text-sm text-gray-400">
              {jobs.length} {jobs.length === 1 ? "position" : "positions"}
            </p>
          </div>
          <JobBoard jobs={jobs} />
        </Container>
      </section>

      {/* Talent pool: resumes without a specific role */}
      <section id="talent-pool" className="scroll-mt-24 bg-surface-muted/60 py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Talent pool</Eyebrow>
            <h2 className="mt-5 text-display-3">
              {jobs.length ? (
                <>
                  Don&apos;t see your role? <span className="text-gradient-ai">Send your resume.</span>
                </>
              ) : (
                <>
                  Be first in line for <span className="text-gradient-ai">what&apos;s next.</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-body-md text-gray-500">
              We review our talent pool every time a new role opens. Tell us about your skills and where you&apos;re based, and
              we&apos;ll reach out when there&apos;s a fit.
            </p>
          </div>
          <div className="mt-10">
            <ApplyForm responseTime={settings.responseTime} />
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
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
