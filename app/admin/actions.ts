"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { caseStudySchema, officeSchema, siteSettingsSchema, type CaseStudy, type InquiryStatus } from "@/lib/content/types";
import {
  checkAdminCredentials,
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/server/auth";
import { deleteUpload, saveUpload, UploadError } from "@/lib/server/media";
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
  const parsed = siteSettingsSchema.safeParse(Object.fromEntries(formData));
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
