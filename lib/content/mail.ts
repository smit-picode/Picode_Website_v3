import { z } from "zod";

/** SMTP settings as stored (password encrypted, never sent to the browser). */
export type StoredSmtp = {
  enabled: boolean;
  host: string;
  port: number;
  /** "auto" = TLS on 465, STARTTLS otherwise. */
  security: "auto" | "tls" | "starttls";
  user: string;
  passwordSealed: string;
  from: string;
  notifyTo: string;
  careersNotifyTo: string;
  updatedAt: string;
};

/** What the admin form sees: everything except the password itself. */
export type SmtpView = Omit<StoredSmtp, "passwordSealed"> & { hasPassword: boolean };

export type MailStatus = { source: "admin" | "env" | "none"; host?: string; recipients: number };

const emailList = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => !v || v.split(",").every((e) => /^\S+@\S+\.\S+$/.test(e.trim())),
    "Use email addresses separated by commas",
  );

export const smtpFormSchema = z
  .object({
    enabled: z.boolean(),
    host: z.string().trim().max(200),
    port: z.coerce.number().int().min(1).max(65535),
    security: z.enum(["auto", "tls", "starttls"]),
    user: z.string().trim().max(200),
    password: z.string().max(500),
    from: z.string().trim().max(200),
    notifyTo: emailList,
    careersNotifyTo: emailList,
  })
  .superRefine((s, ctx) => {
    if (!s.enabled) return;
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(s.host)) ctx.addIssue({ code: "custom", path: ["host"], message: "Enter the SMTP server, e.g. smtp.gmail.com" });
    if (!s.notifyTo) ctx.addIssue({ code: "custom", path: ["notifyTo"], message: "Who should receive notifications?" });
    if (s.from && !/^(.+<\s*\S+@\S+\.\S+\s*>|\S+@\S+\.\S+)$/.test(s.from)) {
      ctx.addIssue({ code: "custom", path: ["from"], message: 'Use an email, or "Name <email@domain.com>"' });
    }
  });
