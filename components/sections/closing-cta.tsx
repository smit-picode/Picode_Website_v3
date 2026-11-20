import { ClosingCtaStage } from "@/components/sections/closing-cta-stage";
import { getPublicSettings, getWhatsAppNumber } from "@/lib/server/store";

/** Homepage closer: describe an idea in a line, then continue the brief on /contact. */
export async function ClosingCta() {
  const [settings, whatsapp] = await Promise.all([getPublicSettings(), getWhatsAppNumber()]);
  const email = settings.salesEmail || settings.generalEmail;
  return <ClosingCtaStage email={email} whatsapp={whatsapp} responseTime={settings.responseTime} />;
}
