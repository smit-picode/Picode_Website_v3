import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document";
import { getLegalDocument } from "@/lib/server/legal-content";
import { getOffices, getPreferences, getPublicSettings } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the Picode website.",
  alternates: { canonical: "/terms" },
};

// Text is managed in /admin → Legal pages.
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const [settings, offices, preferences, doc] = await Promise.all([getPublicSettings(), getOffices(), getPreferences(), getLegalDocument("terms")]);
  const hq = offices.find((o) => o.isHeadquarters) ?? offices[0];

  return (
    <LegalDocumentView
      doc={doc}
      email={settings.generalEmail || settings.supportEmail || settings.salesEmail}
      address={hq?.address ?? "our registered office"}
      dateFormat={preferences.dateFormat}
      related={{ label: "Privacy Policy", href: "/privacy" }}
    />
  );
}
