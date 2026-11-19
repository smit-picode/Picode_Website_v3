import { CaseStudiesShowcase } from "@/components/sections/case-studies-showcase";
import { getCaseStudies } from "@/lib/server/store";

/** Case studies — content (copy, screenshots, logos) is managed in /admin → Case studies. */
export async function CaseStudiesSection() {
  const studies = await getCaseStudies({ publishedOnly: true });
  if (studies.length === 0) return null;
  return (
    <section id="work" aria-label="Case studies" className="relative z-10 scroll-mt-16">
      <CaseStudiesShowcase studies={studies} />
    </section>
  );
}
