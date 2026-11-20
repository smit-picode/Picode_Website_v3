import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document";
import { termsOfService } from "@/lib/content/legal";
import { getOffices, getPreferences, getPublicSettings } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the Picode website.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const [settings, offices, preferences] = await Promise.all([getPublicSettings(), getOffices(), getPreferences()]);
  const hq = offices.find((o) => o.isHeadquarters) ?? offices[0];

  return (
    <LegalDocumentView
      doc={termsOfService}
      email={settings.generalEmail || settings.supportEmail || settings.salesEmail}
      address={hq?.address ?? "our registered office"}
      dateFormat={preferences.dateFormat}
      related={{ label: "Privacy Policy", href: "/privacy" }}
    />
  );
}
