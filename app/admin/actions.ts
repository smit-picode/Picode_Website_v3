"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { caseStudySchema, officeSchema, OPTIONAL_SETTINGS, siteSettingsSchema, type CaseStudy, type InquiryStatus } from "@/lib/content/types";
import {
  checkAdminCredentials,
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/server/auth";
import { deleteUpload, saveUpload, UploadError } from "@/lib/server/media";
import { APPLICATION_STATUSES, jobFormSchema } from "@/lib/content/careers";
import { servicesContentSchema } from "@/lib/content/services-content";
import { DATE_FORMATS, TIME_FORMATS } from "@/lib/format";
import { smtpFormSchema } from "@/lib/content/mail";
import { sendTestEmail } from "@/lib/server/inquiry-email";
import { seal } from "@/lib/server/secret-box";
import { resetServicesContent, saveServicesContent } from "@/lib/server/site-content";
import {
  deleteApplication,
  deleteJob,
  jobIdTaken,
  moveJob,
  saveJob,
  setApplicationStatus,
  setJobPublished,
} from "@/lib/server/careers";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";
import {
  deleteCaseStudy,
  deleteInquiry,
  deleteOffice,
  getCaseStudy,
  moveCaseStudy,
  referencedMedia,
  upsertCaseStudy,
  saveSettings,
  savePreferences,
  getSmtp,
  saveSmtp,
  setInquiryStatus,
  upsertOffice,
} from "@/lib/server/store";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

function fieldErrorsFrom(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Public site content changed → re-render home, footer, etc. */
function refreshPublicSite() {
  revalidatePath("/", "layout");
}

/* ------------------------------- Auth ------------------------------- */

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = getClientIp(headers());
  const limit = rateLimit(`admin-login:${ip}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.success) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { email, password, next } = parsed.data;
  if (!(await checkAdminCredentials(email, password))) {
    return { error: "Invalid username or password." };
  }

  await startAdminSession(email.trim().toLowerCase());
  // Only allow redirects back into the admin area (no open redirects).
  redirect(next && /^\/admin(\/|$)/.test(next) && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function logoutAction() {
  endAdminSession();
  redirect("/admin/login");
}

/* ----------------------------- Inquiries ---------------------------- */

const statusSchema = z.enum(["new", "read", "archived"]);

export async function setInquiryStatusAction(id: string, status: InquiryStatus) {
  await requireAdmin();
  await setInquiryStatus(z.string().uuid().parse(id), statusSchema.parse(status));
  revalidatePath("/admin");
}

export async function deleteInquiryAction(id: string) {
  await requireAdmin();
  await deleteInquiry(z.string().uuid().parse(id));
  revalidatePath("/admin");
}

/* ------------------------------ Offices ----------------------------- */

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 40);
}

export async function saveOfficeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = officeSchema.safeParse({
    ...raw,
    id: raw.id || `${slugify(raw.city ?? "office")}-${crypto.randomUUID().slice(0, 6)}`,
    isHeadquarters: raw.isHeadquarters === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await upsertOffice(parsed.data);
  refreshPublicSite();
  revalidatePath("/admin");
  return { ok: true, message: `${parsed.data.city} office saved.` };
}

export async function deleteOfficeAction(id: string) {
  await requireAdmin();
  await deleteOffice(z.string().min(1).parse(id));
  refreshPublicSite();
  revalidatePath("/admin");
}

/* ----------------------------- Settings ----------------------------- */

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const show = Object.fromEntries(OPTIONAL_SETTINGS.map((k) => [k, raw[`show_${k}`] === "on"]));
  const parsed = siteSettingsSchema.safeParse({ ...raw, show });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await saveSettings(parsed.data);
  refreshPublicSite();
  revalidatePath("/admin");
  return { ok: true, message: "Contact settings saved." };
}

/* --------------------------- Case studies --------------------------- */

const IMAGE_FIELDS = ["logo", "desktopImage", "mobileImage"] as const;

/** Removes uploads that no case study points at any more. */
async function cleanUpMedia(paths: string[]) {
  const inUse = await referencedMedia();
  await Promise.all(paths.filter((p) => p && !inUse.has(p)).map((p) => deleteUpload(p).catch(() => undefined)));
}

export async function saveCaseStudyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const text = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : "";
  };

  const id = text("id");
  const existing = id ? await getCaseStudy(id) : undefined;
  if (id && !existing) return { error: "This case study no longer exists. Reload the page." };

  const services = [0, 1, 2]
    .map((i) => ({ title: text(`service${i}Title`).trim(), description: text(`service${i}Description`).trim() }))
    .filter((s) => s.title || s.description);

  // Images: keep the current one, replace it with a new upload, or remove it.
  const images: Record<(typeof IMAGE_FIELDS)[number], string> = {
    logo: existing?.logo ?? "",
    desktopImage: existing?.desktopImage ?? "",
    mobileImage: existing?.mobileImage ?? "",
  };
  const uploaded: string[] = [];
  try {
    for (const field of IMAGE_FIELDS) {
      const file = formData.get(`${field}File`);
      if (file instanceof File && file.size > 0) {
        images[field] = await saveUpload(file);
        uploaded.push(images[field]);
      } else if (text(`${field}Remove`) === "1") {
        images[field] = "";
      }
    }
  } catch (error) {
    await Promise.all(uploaded.map((p) => deleteUpload(p)));
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }

  const name = text("name");
  const parsed = caseStudySchema.safeParse({
    id: id || `${slugify(name || "project")}-${crypto.randomUUID().slice(0, 6)}`,
    name,
    category: text("category"),
    headline: text("headline"),
    headlineAccent: text("headlineAccent"),
    summary: text("summary"),
    services,
    accent: text("accent"),
    preview: text("preview") || "both",
    url: text("url"),
    ...images,
    published: text("published") === "on",
    order: existing?.order ?? 0,
  });

  if (!parsed.success) {
    await Promise.all(uploaded.map((p) => deleteUpload(p)));
    const fieldErrors = fieldErrorsFrom(parsed.error);
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "services" && typeof issue.path[1] === "number") {
        fieldErrors[`service${issue.path[1]}`] ??= issue.message;
      }
    }
    return { fieldErrors, error: "Please fix the highlighted fields." };
  }

  const previous = await upsertCaseStudy(parsed.data);
  if (previous) await cleanUpMedia(IMAGE_FIELDS.map((f) => previous[f]));

  refreshPublicSite();
  revalidatePath("/admin");
  return { ok: true, message: `${parsed.data.name} saved.` };
}

export async function deleteCaseStudyAction(id: string) {
  await requireAdmin();
  const removed: CaseStudy | undefined = await deleteCaseStudy(z.string().min(1).parse(id));
  if (removed) await cleanUpMedia(IMAGE_FIELDS.map((f) => removed[f]));
  refreshPublicSite();
  revalidatePath("/admin");
}

export async function moveCaseStudyAction(id: string, direction: -1 | 1) {
  await requireAdmin();
  await moveCaseStudy(z.string().min(1).parse(id), z.union([z.literal(-1), z.literal(1)]).parse(direction));
  refreshPublicSite();
  revalidatePath("/admin");
}

export async function setCaseStudyPublishedAction(id: string, published: boolean) {
  await requireAdmin();
  const study = await getCaseStudy(z.string().min(1).parse(id));
  if (!study) return;
  await upsertCaseStudy({ ...study, published: z.boolean().parse(published) });
  refreshPublicSite();
  revalidatePath("/admin");
}

/* ------------------------------ Careers ----------------------------- */

function refreshCareers(jobIds: string[] = []) {
  revalidatePath("/careers");
  for (const id of jobIds) revalidatePath(`/careers/${id}`);
  revalidatePath("/admin");
}

export async function saveJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const originalId = raw.originalId || undefined;
  const parsed = jobFormSchema.safeParse({
    ...raw,
    id: raw.id || slugify(raw.title ?? ""),
    published: raw.published === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  if (await jobIdTaken(parsed.data.id, originalId)) {
    return { fieldErrors: { id: "Another job already uses this link. Pick a different one." } };
  }

  await saveJob(parsed.data, originalId);
  refreshCareers([parsed.data.id, ...(originalId && originalId !== parsed.data.id ? [originalId] : [])]);
  return { ok: true, message: `${parsed.data.title} saved.` };
}

export async function setJobPublishedAction(id: string, published: boolean) {
  await requireAdmin();
  const jobId = z.string().min(1).parse(id);
  await setJobPublished(jobId, z.boolean().parse(published));
  refreshCareers([jobId]);
}

export async function deleteJobAction(id: string) {
  await requireAdmin();
  const jobId = z.string().min(1).parse(id);
  await deleteJob(jobId);
  refreshCareers([jobId]);
}

export async function moveJobAction(id: string, direction: -1 | 1) {
  await requireAdmin();
  await moveJob(z.string().min(1).parse(id), z.union([z.literal(-1), z.literal(1)]).parse(direction));
  refreshCareers();
}

export async function setApplicationStatusAction(id: string, status: string) {
  await requireAdmin();
  await setApplicationStatus(z.string().uuid().parse(id), z.enum(APPLICATION_STATUSES).parse(status));
  revalidatePath("/admin");
}

export async function deleteApplicationAction(id: string) {
  await requireAdmin();
  await deleteApplication(z.string().uuid().parse(id));
  revalidatePath("/admin");
}

/* ---------------------------- Preferences --------------------------- */

const preferencesFormSchema = z.object({
  dateFormat: z.enum(DATE_FORMATS),
  timeFormat: z.enum(TIME_FORMATS),
});

export async function savePreferencesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = preferencesFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  await savePreferences(parsed.data);
  refreshPublicSite();
  revalidatePath("/admin");
  return { ok: true, message: "Preferences saved." };
}

/* ------------------------------ Services ---------------------------- */

export type ServicesSaveState = { ok?: boolean; error?: string; message?: string; issues?: string[] };

export async function saveServicesContentAction(json: string): Promise<ServicesSaveState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { error: "Couldn't read the content." };
  }
  const parsed = servicesContentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Some fields need attention.",
      issues: parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(" › ")}: ${i.message}`),
    };
  }
  const ids = parsed.data.services.map((s) => s.id);
  if (new Set(ids).size !== ids.length) return { error: "Two services share the same id." };
  const indIds = parsed.data.industries.map((s) => s.id);
  if (new Set(indIds).size !== indIds.length) return { error: "Two industries share the same id." };

  await saveServicesContent(parsed.data);
  revalidatePath("/services");
  revalidatePath("/admin");
  return { ok: true, message: "Services page saved." };
}

export async function resetServicesContentAction(): Promise<ServicesSaveState> {
  await requireAdmin();
  await resetServicesContent();
  revalidatePath("/services");
  revalidatePath("/admin");
  return { ok: true, message: "Restored the original services content." };
}

/* ------------------------------- Email ------------------------------ */

export async function saveSmtpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = smtpFormSchema.safeParse({ ...raw, enabled: raw.enabled === "on", password: raw.password ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { password, ...rest } = parsed.data;
  const current = await getSmtp();
  // Blank password = keep the saved one; "clearPassword" removes it.
  const passwordSealed = raw.clearPassword === "on" ? "" : password ? seal(password) : (current?.passwordSealed ?? "");
  await saveSmtp({ ...rest, passwordSealed, updatedAt: new Date().toISOString() });
  revalidatePath("/admin");
  return { ok: true, message: rest.enabled ? "Email settings saved and in use." : "Saved. Email uses the .env settings while this is off." };
}

export async function sendTestEmailAction(to: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const address = z.string().trim().email().safeParse(to);
  if (!address.success) return { ok: false, message: "Enter a valid email address to send the test to." };
  const ip = getClientIp(headers());
  if (!rateLimit(`smtp-test:${ip}`, { limit: 5, windowMs: 10 * 60_000 }).success) {
    return { ok: false, message: "Too many test emails. Try again in a few minutes." };
  }
  const r = await sendTestEmail(address.data);
  return r.ok
    ? { ok: true, message: `Test email sent to ${address.data} (using ${r.source === "admin" ? "these settings" : "the .env settings"}).` }
    : { ok: false, message: `Couldn't send: ${r.error}` };
}
