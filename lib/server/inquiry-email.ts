import "server-only";

import type { Application } from "@/lib/content/careers";
import type { Inquiry } from "@/lib/content/types";
import { getMailConfig, transportFor } from "@/lib/server/mail-config";
import { siteConfig } from "@/lib/site";

/**
 * Emails the team whenever a new inquiry arrives (contact brief or the site assistant).
 *
 * SMTP comes from Admin → Settings → Email, or else the SMTP_* env vars (see
 * lib/server/mail-config.ts). Works with Gmail/Google Workspace app passwords, Zoho,
 * Microsoft 365, Mailjet, SES, Brevo, Mailgun… Without a configuration or recipients,
 * notifications are skipped silently.
 */

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
  const cfg = await getMailConfig();
  const to = cfg?.notifyTo ?? [];
  if (!cfg || !to.length) return;
  const transport = transportFor(cfg);

  const { subject, text, html } = buildInquiryEmail(inq);
  try {
    await transport.sendMail({
      from: cfg.from,
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

/* ------------------------------------------------------------------ */
/* Job applications                                                    */
/* ------------------------------------------------------------------ */

/** Tells the team about a new application (CAREERS_NOTIFY_TO, else INQUIRY_NOTIFY_TO). Never throws. */
export async function sendApplicationNotification(app: Application): Promise<void> {
  const cfg = await getMailConfig();
  const to = cfg?.careersNotifyTo ?? [];
  if (!cfg || !to.length) return;
  const transport = transportFor(cfg);

  const role = app.jobTitle ?? "Talent pool (no specific role)";
  const adminUrl = `${siteConfig.url.replace(/\/$/, "")}/admin?tab=applications`;
  const rows: [string, string][] = [
    ["Role", role],
    ["Name", app.name],
    ["Email", app.email],
    ...(app.phone ? [["Phone", app.phone] as [string, string]] : []),
    ["Location", [app.city, app.country].filter(Boolean).join(", ")],
    ["Experience", `${app.experienceYears} years${app.currentTitle ? ` · ${app.currentTitle}` : ""}`],
    ["Skills", app.skills.join(", ")],
    ["Languages", app.languages.join(", ")],
    ...(app.workMode ? [["Work mode", app.workMode] as [string, string]] : []),
    ...(app.noticePeriod ? [["Notice", app.noticePeriod] as [string, string]] : []),
    ...(app.linkedin ? [["LinkedIn", app.linkedin] as [string, string]] : []),
    ...(app.portfolio ? [["Portfolio", app.portfolio] as [string, string]] : []),
  ];
  const subject = oneLine(`New application: ${app.name} · ${role}`);
  const text = [
    `New job application · ${role}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(app.note ? ["", "Note:", app.note] : []),
    "",
    `Resume and details: ${adminUrl}`,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background-color:#14b8a6;background:linear-gradient(135deg,#14b8a6,#0ea5e9);padding:20px 24px;color:#fff">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9">${esc(role)}</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px">New application from ${esc(app.name)}</div>
      </td></tr>
      <tr><td style="padding:20px 24px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
        ${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#64748b;width:110px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`).join("")}
      </table></td></tr>
      ${app.note ? `<tr><td style="padding:12px 24px 4px"><div style="font-size:14px;line-height:1.6;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;white-space:pre-wrap">${esc(app.note)}</div></td></tr>` : ""}
      <tr><td style="padding:20px 24px 24px"><a href="${esc(adminUrl)}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:999px">Review in admin</a></td></tr>
    </table>
    <div style="font-size:12px;color:#94a3b8;margin-top:12px">The resume is attached in the admin panel (not by email).</div>
  </td></tr></table></body></html>`;

  try {
    await transport.sendMail({
      from: cfg.from,
      to,
      replyTo: { name: oneLine(app.name), address: app.email },
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("[careers] Email notification failed:", error);
  }
}

/** Admin → Settings → "Send test email". Returns a readable error instead of throwing. */
export async function sendTestEmail(to: string): Promise<{ ok: true; source: string } | { ok: false; error: string }> {
  const cfg = await getMailConfig();
  if (!cfg) return { ok: false, error: "Email isn't configured yet." };
  try {
    await transportFor(cfg).sendMail({
      from: cfg.from,
      to,
      subject: "Picode website · test email",
      text: `This is a test from the Picode website admin.\n\nSMTP server: ${cfg.host}:${cfg.port}\nSettings from: ${cfg.source === "admin" ? "Admin → Settings" : ".env file"}\n\nIf you can read this, notifications will arrive.`,
    });
    return { ok: true, source: cfg.source };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: msg.replace(/\s+/g, " ").slice(0, 300) };
  }
}
