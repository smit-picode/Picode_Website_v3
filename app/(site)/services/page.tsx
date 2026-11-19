import type { Metadata } from "next";
import { EngagementModels, ServicesCta, ServicesFaq } from "@/components/services/engage";
import { IndustriesExplorer } from "@/components/services/industries";
import { ServiceChapters } from "@/components/services/service-chapters";
import { ServicesHero } from "@/components/services/services-hero";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Agentic application modernization, custom web & mobile development, intelligent workflow automation and data-driven platforms for healthcare, finance, real estate, social and more.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <ServiceChapters />
      <IndustriesExplorer />
      <EngagementModels />
      <ServicesFaq />
      <ServicesCta />
    </>
  );
}
