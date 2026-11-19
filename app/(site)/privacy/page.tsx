import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document";
import { privacyPolicy } from "@/lib/content/legal";
import { getOffices, getSettings } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Picode collects, uses and protects your personal data, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const [settings, offices] = await Promise.all([getSettings(), getOffices()]);
  const hq = offices.find((o) => o.isHeadquarters) ?? offices[0];

  return (
    <LegalDocumentView
      doc={privacyPolicy}
      email={settings.generalEmail}
      address={hq?.address ?? "our registered office"}
      related={{ label: "Terms of Service", href: "/terms" }}
    />
  );
}
