import { AINativeSection } from "@/components/sections/ai-native";
import { CaseStudiesSection } from "@/components/sections/case-studies";
import { ClosingCta } from "@/components/sections/closing-cta";
import { HeroSection } from "@/components/sections/hero";
import { OfferingsSection } from "@/components/sections/offerings";
import { TechStackSection } from "@/components/sections/tech-stack";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <OfferingsSection />
      <AINativeSection />
      <TechStackSection />
      <CaseStudiesSection />
      <ClosingCta />
    </>
  );
}
