import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { MailStatus } from "@/lib/content/mail";
import { open } from "@/lib/server/secret-box";
import { getSmtp } from "@/lib/server/store";

/**
 * Where outgoing email settings come from:
 *  1. Admin → Settings → Email (SMTP), when switched on and complete;
 *  2. otherwise the SMTP_* / MAIL_FROM / *_NOTIFY_TO env vars;
 *  3. otherwise email is off (notifications are skipped silently).
 */
export type MailConfig = {
  source: "admin" | "env";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  notifyTo: string[];
  careersNotifyTo: string[];
};

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function getMailConfig(): Promise<MailConfig | null> {
  const s = await getSmtp().catch(() => null);
  if (s?.enabled && s.host) {
    const pass = s.passwordSealed ? open(s.passwordSealed) : "";
    if (pass !== null) {
      const notifyTo = list(s.notifyTo);
      return {
        source: "admin",
        host: s.host,
        port: s.port,
        secure: s.security === "tls" || (s.security === "auto" && s.port === 465),
        user: s.user,
        pass,
        from: s.from || s.user,
        notifyTo,
        careersNotifyTo: list(s.careersNotifyTo).length ? list(s.careersNotifyTo) : notifyTo,
      };
    }
    console.error("[mail] Stored SMTP password can't be decrypted (ADMIN_SESSION_SECRET changed?). Falling back to env.");
  }

  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const notifyTo = list(process.env.INQUIRY_NOTIFY_TO);
  return {
    source: "env",
    host,
    port,
    secure: port === 465,
    user: process.env.SMTP_USER?.trim() ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || "",
    notifyTo,
    careersNotifyTo: list(process.env.CAREERS_NOTIFY_TO).length ? list(process.env.CAREERS_NOTIFY_TO) : notifyTo,
  };
}

/** One pooled transporter per distinct configuration. */
let cached: { key: string; transport: Transporter } | null = null;

export function transportFor(c: MailConfig): Transporter {
  const key = JSON.stringify([c.host, c.port, c.secure, c.user, c.pass]);
  if (cached?.key === key) return cached.transport;
  cached?.transport.close();
  const transport = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: c.user ? { user: c.user, pass: c.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  cached = { key, transport };
  return transport;
}

export async function mailStatus(): Promise<MailStatus> {
  const c = await getMailConfig();
  return c ? { source: c.source, host: c.host, recipients: c.notifyTo.length } : { source: "none", recipients: 0 };
}
