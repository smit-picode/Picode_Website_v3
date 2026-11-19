import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { Inquiry } from "@/lib/content/types";
import { siteConfig } from "@/lib/site";

/**
 * Emails the team whenever a new inquiry arrives (contact brief or the site assistant).
 *
 * Configure with SMTP env vars (works with Google Workspace/Gmail app passwords, Zoho,
 * Microsoft 365, SES, Brevo, Mailgun…):
 *   SMTP_HOST, SMTP_PORT (465 = TLS, 587 = STARTTLS), SMTP_USER, SMTP_PASS,
 *   MAIL_FROM            e.g. "Picode Website <no-reply@picode.ai>" (defaults to SMTP_USER)
 *   INQUIRY_NOTIFY_TO    comma-separated recipients, e.g. "sales@picode.ai, vishal@picode.ai"
 * Without SMTP_HOST or INQUIRY_NOTIFY_TO, notifications are skipped silently.
 */

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASS ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

function recipients(): string[] {
  return (process.env.INQUIRY_NOTIFY_TO ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function inquiryEmailEnabled() {
  return Boolean(process.env.SMTP_HOST?.trim() && recipients().length);
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Keep header values on one line (no header injection via names). */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

function sourceOf(inq: Inquiry) {
  if (inq.message.startsWith("Question from the website assistant:")) return "Website assistant";
  if (inq.brief) return "Project brief";
  return "Contact form";
}

export function buildInquiryEmail(inq: Inquiry) {
  const source = sourceOf(inq);
  const adminUrl = `${siteConfig.url.replace(/\/$/, "")}/admin?tab=inquiries`;
  const when = new Date(inq.receivedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const rows: [string, string][] = [
    ["Name", inq.name],
    ["Email", inq.email],
    ...(inq.company ? [["Company", inq.company] as [string, string]] : []),
    ...(inq.brief?.types.length ? [["Looking for", inq.brief.types.join(", ")] as [string, string]] : []),
    ...(inq.brief?.stage ? [["Stage", inq.brief.stage] as [string, string]] : []),
    ...(inq.brief?.timeline ? [["Timeline", inq.brief.timeline] as [string, string]] : []),
    ...(inq.brief?.budget ? [["Budget", inq.brief.budget] as [string, string]] : []),
    ["Source", source],
    ["Received", `${when} IST`],
  ];

  const subject = oneLine(`New inquiry from ${inq.name}${inq.company ? ` (${inq.company})` : ""} · ${source}`);

  const text = [
    `New inquiry · ${source}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message:",
    inq.message,
    "",
    `Reply to this email to answer ${inq.name} directly.`,
    `Admin: ${adminUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f4f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:linear-gradient(135deg,#14b8a6,#0ea5e9);background-color:#14b8a6;padding:20px 24px;color:#ffffff">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9">${esc(source)}</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">New inquiry from ${esc(inq.name)}</div>
        </td></tr>
        <tr><td style="padding:20px 24px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
            ${rows
              .map(
                ([k, v]) => `<tr>
              <td style="padding:6px 0;color:#64748b;width:120px;vertical-align:top">${esc(k)}</td>
              <td style="padding:6px 0;font-weight:600">${
                k === "Email" ? `<a href="mailto:${esc(v)}" style="color:#0d9488">${esc(v)}</a>` : esc(v)
              }</td></tr>`,
              )
              .join("")}
          </table>
        </td></tr>
        <tr><td style="padding:12px 24px 4px">
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Message</div>
          <div style="font-size:14px;line-height:1.6;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;white-space:pre-wrap">${esc(inq.message)}</div>
        </td></tr>
        <tr><td style="padding:20px 24px 24px">
          <a href="mailto:${esc(inq.email)}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:999px">Reply to ${esc(inq.name.split(" ")[0] ?? inq.name)}</a>
          <a href="${esc(adminUrl)}" style="display:inline-block;margin-left:8px;color:#0d9488;font-size:14px;font-weight:600;text-decoration:none;padding:10px 4px">Open in admin →</a>
        </td></tr>
      </table>
      <div style="font-size:12px;color:#94a3b8;margin-top:12px">Sent automatically by the Picode website.</div>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

/** Sends the team notification. Never throws: the inquiry is already stored. */
export async function sendInquiryNotification(inq: Inquiry): Promise<void> {
  const transport = getTransport();
  const to = recipients();
  if (!transport || !to.length) return;

  const { subject, text, html } = buildInquiryEmail(inq);
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM?.trim() || process.env.SMTP_USER?.trim(),
      to,
      replyTo: { name: oneLine(inq.name), address: inq.email },
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("[contact] Email notification failed:", error);
  }
}
