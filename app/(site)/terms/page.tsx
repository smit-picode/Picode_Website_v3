import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document";
import { termsOfService } from "@/lib/content/legal";
import { getOffices, getSettings } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the Picode website.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const [settings, offices] = await Promise.all([getSettings(), getOffices()]);
  const hq = offices.find((o) => o.isHeadquarters) ?? offices[0];

  return (
    <LegalDocumentView
      doc={termsOfService}
      email={settings.generalEmail}
      address={hq?.address ?? "our registered office"}
      related={{ label: "Privacy Policy", href: "/privacy" }}
    />
  );
}
