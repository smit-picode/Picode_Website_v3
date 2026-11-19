import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SitemapExplorer, type SitemapGroup } from "@/components/sitemap/sitemap-explorer";
import { footerNav, mainNav, underDevelopmentRoutes } from "@/lib/site";
import { getCaseStudies } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Explore every page on the Picode website: services, company, contact and more.",
};

/** One-line descriptions shown under each link (falls back to the URL). */
const hints: Record<string, string> = {
  "/": "Start here: AI-native solutions that accelerate your growth",
  "/#offerings": "Six ways we help: agents, apps, automation, data, design and cloud",
  "/#ai-native": "Our AI-driven development lifecycle, phase by phase",
  "/#tech": "Languages, frameworks and cloud we build with",
  "/#work": "Real projects we've shipped for our clients",
  "/#contact": "Six quick questions to start your project brief",
  "/#offices": "Bengaluru and Dubai: addresses, phones and directions",
  "/about": "Our story, mission and team",
  "/careers": "Open roles and life at Picode",
  "/contact": "Offices, emails and the contact form",
  "/services": "Our four core offerings, engagement models and accelerators",
  "/services#agentic-modernization": "Modernize existing applications and add AI agents",
  "/services#web-mobile": "Custom web, enterprise and iOS & Android apps",
  "/services#workflow-automation": "Digitize approvals, documents and manual processes",
  "/services#data-driven-apps": "Dashboards, Customer 360 and AI-driven insights",
  "/services#included": "Design, cloud & DevOps, testing and integration",
  "/services#engagement": "Project-based, dedicated teams or ongoing engineering",
  "/services#accelerators": "Reusable foundations for agents, workflows and data apps",
  "/services#process": "Discover, design, build & integrate, launch & evolve",
  "/privacy": "How we handle your data",
  "/terms": "The terms for using this site",
};

type Link = { label: string; href: string };

/** "Coming soon" routes still render the under-development fallback. */
const isComingSoon = (href: string) => href.replace(/^\//, "") in underDevelopmentRoutes;

function unique(links: Link[]) {
  const seen = new Set<string>();
  return links.filter((l) => !seen.has(l.href) && seen.add(l.href));
}

/**
 * Human-readable sitemap (/sitemap). Built from the same navigation as the
 * header, footer and /sitemap.xml, so it never drifts from the real links.
 * The interactive map/search lives in <SitemapExplorer /> (client).
 */
export default async function SitemapPage() {
  // The Case studies section only renders when at least one study is published.
  // (Admin edits revalidate the whole site, so this stays in sync.)
  const hasCaseStudies = (await getCaseStudies({ publishedOnly: true })).length > 0;

  const toGroup = (title: string, blurb: string, links: Link[]): SitemapGroup => ({
    title,
    blurb,
    items: unique(links).map((l) => ({
      label: l.label,
      href: l.href,
      hint: hints[l.href] ?? l.href,
      soon: isComingSoon(l.href),
    })),
  });

  const groups: SitemapGroup[] = [
    // Mirrors app/(site)/page.tsx, in page order; labels match each section's heading.
    toGroup("Home", "Sections on the homepage", [
      { label: "Home", href: "/" },
      { label: "Core offerings", href: "/#offerings" },
      { label: "AI-driven lifecycle", href: "/#ai-native" },
      { label: "Our tech stack", href: "/#tech" },
      ...(hasCaseStudies ? [{ label: "Case studies", href: "/#work" }] : []),
      { label: "Let's build together", href: "/#contact" },
      { label: "Our offices", href: "/#offices" },
    ]),
    toGroup("Company", "Who we are", [
      ...mainNav.filter((i) => i.href !== "/" && !i.href.startsWith("/services")),
      ...(footerNav.find((g) => g.title === "Company")?.items ?? []),
    ]),
    // Mirrors app/(site)/services/page.tsx, in page order; labels match each section.
    toGroup("Services", "What we build and how we work", [
      { label: "All services", href: "/services" },
      { label: "Agentic Modernization", href: "/services#agentic-modernization" },
      { label: "Web & Mobile Apps", href: "/services#web-mobile" },
      { label: "Workflow Automation", href: "/services#workflow-automation" },
      { label: "Data-Driven Apps", href: "/services#data-driven-apps" },
      { label: "Included in every engagement", href: "/services#included" },
      { label: "Engagement models", href: "/services#engagement" },
      { label: "Accelerators", href: "/services#accelerators" },
      { label: "How we deliver", href: "/services#process" },
    ]),
    toGroup("Legal", "The fine print", [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ]),
  ];

  return (
    <section className="relative overflow-hidden pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-glow-brand opacity-[0.10]" />
      <Container className="relative">
        <SitemapExplorer groups={groups} />
      </Container>
    </section>
  );
}
