import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document";
import { getLegalDocument } from "@/lib/server/legal-content";
import { getOffices, getPreferences, getPublicSettings } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Picode collects, uses and protects your personal data, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

// Text is managed in /admin → Legal pages.
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const [settings, offices, preferences, doc] = await Promise.all([getPublicSettings(), getOffices(), getPreferences(), getLegalDocument("privacy")]);
  const hq = offices.find((o) => o.isHeadquarters) ?? offices[0];

  return (
    <LegalDocumentView
      doc={doc}
      email={settings.generalEmail || settings.supportEmail || settings.salesEmail}
      address={hq?.address ?? "our registered office"}
      dateFormat={preferences.dateFormat}
      related={{ label: "Terms of Service", href: "/terms" }}
    />
  );
}
