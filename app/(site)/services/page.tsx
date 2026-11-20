import type { Metadata } from "next";
import { ServicesContentProvider } from "@/components/services/content-context";
import { EngagementModels, ServicesCta, ServicesFaq } from "@/components/services/engage";
import { IndustriesExplorer } from "@/components/services/industries";
import { ServiceChapters } from "@/components/services/service-chapters";
import { ServicesHero } from "@/components/services/services-hero";
import { getServicesContent } from "@/lib/server/site-content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Agentic application modernization, custom web & mobile development, intelligent workflow automation and data-driven platforms for healthcare, finance, real estate, social and more.",
};

// Content is managed in /admin → Services.
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const content = await getServicesContent();
  return (
    <ServicesContentProvider content={content}>
      <ServicesHero />
      <ServiceChapters />
      <IndustriesExplorer />
      <EngagementModels />
      <ServicesFaq />
      <ServicesCta />
    </ServicesContentProvider>
  );
}
