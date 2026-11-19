import "server-only";

import type { Inquiry } from "@/lib/content/types";
import { sendInquiryNotification } from "@/lib/server/inquiry-email";
import { addInquiry } from "@/lib/server/store";
import type { ContactInput } from "@/lib/validations/contact";

/**
 * Persists a contact submission (visible in /admin → Inquiries) and,
 * if CONTACT_WEBHOOK_URL is set, forwards it as JSON (Slack via Zapier/Make/n8n,
 * a CRM…), and emails the team when SMTP is configured (see inquiry-email.ts).
 * Neither failure loses the inquiry — it is stored first.
 */
export async function deliverContactSubmission(
  input: ContactInput,
  meta: { ip: string; userAgent: string | null },
): Promise<Inquiry> {
  const inquiry: Inquiry = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    status: "new",
    name: input.name,
    email: input.email,
    company: input.company || undefined,
    message: input.message,
    brief: input.brief && (input.brief.types.length || input.brief.stage || input.brief.timeline || input.brief.budget)
      ? input.brief
      : undefined,
    ip: meta.ip,
    userAgent: meta.userAgent,
  };

  await addInquiry(inquiry);

  await Promise.all([forwardToWebhook(inquiry), sendInquiryNotification(inquiry)]);

  return inquiry;
}

async function forwardToWebhook(inquiry: Inquiry) {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) return;
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "contact_submission", ...inquiry }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) console.error(`[contact] Webhook responded with ${res.status}`);
  } catch (error) {
    console.error("[contact] Webhook delivery failed:", error);
  }
}
