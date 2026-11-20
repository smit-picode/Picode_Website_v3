import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { APPLICATION_STATUSES, type Application, type JobPost } from "@/lib/content/careers";
import { servicesContentSchema } from "@/lib/content/services-content";
import { caseStudySchema, MEDIA_PATH_RE, officeSchema, siteSettingsSchema, type Inquiry } from "@/lib/content/types";
import { DATE_FORMATS, TIME_FORMATS } from "@/lib/format";
import {
  checkResumeBytes,
  importApplications,
  importJobs,
  listApplications,
  listJobs,
  listResumeFiles,
} from "@/lib/server/careers";
import { UPLOAD_DIR } from "@/lib/server/media";
import { getServicesContent, saveServicesContent } from "@/lib/server/site-content";
import { importStoreData, readStoreSnapshot, type StoreSnapshot } from "@/lib/server/store";

/**
 * Full-site export / import (Admin → Settings). One JSON file holds every collection;
 * with `files`, it also carries uploaded case-study images and resumes as base64.
 */
export const EXPORT_FORMAT = "picode-site-export";
export const SECTIONS = ["settings", "offices", "caseStudies", "inquiries", "jobs", "applications", "services"] as const;
export type Section = (typeof SECTIONS)[number];
export const SECTION_LABEL: Record<Section, string> = {
  settings: "Contact settings & preferences",
  offices: "Offices",
  caseStudies: "Case studies",
  inquiries: "Inquiries",
  jobs: "Job posts",
  applications: "Job applications",
  services: "Services page",
};

type ExportFile = {
  format: typeof EXPORT_FORMAT;
  version: 1;
  exportedAt: string;
  data: Partial<{
    settings: StoreSnapshot["settings"];
    preferences: StoreSnapshot["preferences"];
    offices: StoreSnapshot["offices"];
    caseStudies: StoreSnapshot["caseStudies"];
    inquiries: StoreSnapshot["inquiries"];
    jobs: JobPost[];
    applications: Application[];
    services: Awaited<ReturnType<typeof getServicesContent>>;
  }>;
  files?: {
    uploads?: Record<string, string>;
    resumes?: Record<string, { fileName: string; mimeType: string; base64: string }>;
  };
};

/* ------------------------------------------------------------------ */
/* Export                                                               */
/* ------------------------------------------------------------------ */

export async function buildExport(sections: Section[], withFiles: boolean): Promise<ExportFile> {
  const want = new Set(sections);
  const store = await readStoreSnapshot();
  const out: ExportFile = { format: EXPORT_FORMAT, version: 1, exportedAt: new Date().toISOString(), data: {} };

  if (want.has("settings")) {
    out.data.settings = store.settings;
    out.data.preferences = store.preferences;
  }
  if (want.has("offices")) out.data.offices = store.offices;
  if (want.has("caseStudies")) out.data.caseStudies = store.caseStudies;
  if (want.has("inquiries")) out.data.inquiries = store.inquiries;
  if (want.has("services")) out.data.services = await getServicesContent();
  if (want.has("jobs")) out.data.jobs = await listJobs();
  if (want.has("applications")) out.data.applications = await listApplications();

  if (withFiles) {
    out.files = {};
    if (want.has("caseStudies")) {
      const names = new Set(
        store.caseStudies.flatMap((c) => [c.logo, c.desktopImage, c.mobileImage]).filter(Boolean).map((p) => path.basename(p)),
      );
      out.files.uploads = {};
      for (const name of names) {
        try {
          out.files.uploads[name] = (await fs.readFile(path.join(UPLOAD_DIR, name))).toString("base64");
        } catch {
          /* missing file: the path is still exported */
        }
      }
    }
    if (want.has("applications")) {
      out.files.resumes = {};
      for (const r of await listResumeFiles()) {
        out.files.resumes[r.application_id] = { fileName: r.file_name, mimeType: r.mime_type, base64: r.data.toString("base64") };
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Import                                                               */
/* ------------------------------------------------------------------ */

const preferencesSchema = z.object({ dateFormat: z.enum(DATE_FORMATS), timeFormat: z.enum(TIME_FORMATS) });

const inquirySchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().max(200),
  email: z.string().max(200),
  company: z.string().max(200).optional(),
  message: z.string().max(10_000),
  brief: z
    .object({ types: z.array(z.string()), stage: z.string().optional(), timeline: z.string().optional(), budget: z.string().optional() })
    .optional(),
  status: z.enum(["new", "read", "archived"]),
  receivedAt: z.string(),
  ip: z.string().max(100).default(""),
  userAgent: z.string().max(500).nullable().default(null),
});

const strArr = z.array(z.string().max(300)).max(50);
const jobSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60),
  title: z.string().min(1).max(120),
  team: z.string().max(60),
  location: z.string().max(80),
  employmentType: z.string().max(40),
  experience: z.string().max(40).default(""),
  summary: z.string().max(220),
  about: z.string().max(3000).default(""),
  responsibilities: strArr,
  requirements: strArr,
  niceToHave: strArr,
  skills: strArr,
  published: z.boolean(),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string().default(""),
});

const applicationSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().max(60).nullable(),
  jobTitle: z.string().max(200).nullable(),
  name: z.string().min(1).max(100),
  email: z.string().max(200),
  phone: z.string().max(30).default(""),
  city: z.string().max(80).default(""),
  country: z.string().max(80).default(""),
  experienceYears: z.number().min(0).max(99),
  currentTitle: z.string().max(100).default(""),
  skills: strArr,
  languages: strArr,
  workMode: z.string().max(30).default(""),
  noticePeriod: z.string().max(30).default(""),
  linkedin: z.string().max(300).default(""),
  portfolio: z.string().max(300).default(""),
  note: z.string().max(3000).default(""),
  status: z.enum(APPLICATION_STATUSES),
  createdAt: z.string(),
  resume: z.unknown().optional(),
});

export type ImportSummary = { section: string; imported: number; skipped: number; note?: string }[];

/** Validates each item on its own, so one bad record doesn't block the rest. */
function validList<S extends z.ZodTypeAny>(raw: unknown, schema: S): { ok: z.output<S>[]; skipped: number } {
  if (!Array.isArray(raw)) return { ok: [], skipped: 0 };
  const ok: z.output<S>[] = [];
  let skipped = 0;
  for (const item of raw) {
    const r = schema.safeParse(item);
    if (r.success) ok.push(r.data);
    else skipped++;
  }
  return { ok, skipped };
}

/** Image sniffing for imported case-study uploads (never trust names). */
function isImage(buf: Buffer) {
  if (buf.length < 12) return false;
  return (
    (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") ||
    (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) ||
    (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") ||
    (buf.toString("ascii", 4, 8) === "ftyp" && /^avi[fs]$/.test(buf.toString("ascii", 8, 12)))
  );
}

export class ImportError extends Error {}

export async function applyImport(file: unknown, sections: Section[], mode: "merge" | "replace"): Promise<ImportSummary> {
  const doc = z
    .object({ format: z.literal(EXPORT_FORMAT), version: z.literal(1), data: z.record(z.unknown()), files: z.record(z.unknown()).optional() })
    .safeParse(file);
  if (!doc.success) throw new ImportError("This isn't a Picode export file (or it's from an unsupported version).");
  const { data } = doc.data;
  const files = (doc.data.files ?? {}) as ExportFile["files"] & object;
  const want = new Set(sections);
  const summary: ImportSummary = [];
  const store: Partial<StoreSnapshot> = {};

  if (want.has("settings")) {
    const s = siteSettingsSchema.safeParse(data.settings);
    const p = preferencesSchema.safeParse(data.preferences);
    if (s.success) store.settings = s.data;
    if (p.success) store.preferences = p.data;
    summary.push({ section: SECTION_LABEL.settings, imported: Number(s.success) + Number(p.success), skipped: (data.settings && !s.success ? 1 : 0) + (data.preferences && !p.success ? 1 : 0) });
  }
  if (want.has("offices") && data.offices) {
    const r = validList(data.offices, officeSchema);
    store.offices = r.ok;
    summary.push({ section: SECTION_LABEL.offices, imported: r.ok.length, skipped: r.skipped });
  }
  if (want.has("caseStudies") && data.caseStudies) {
    const r = validList(data.caseStudies, caseStudySchema);
    store.caseStudies = r.ok;
    let images = 0;
    for (const [name, b64] of Object.entries(files.uploads ?? {})) {
      if (!MEDIA_PATH_RE.test(`/api/media/${name}`) || typeof b64 !== "string") continue;
      const buf = Buffer.from(b64, "base64");
      if (buf.length > 8 * 1024 * 1024 || !isImage(buf)) continue;
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, path.basename(name)), buf);
      images++;
    }
    summary.push({ section: SECTION_LABEL.caseStudies, imported: r.ok.length, skipped: r.skipped, note: images ? `${images} images restored` : undefined });
  }
  if (want.has("inquiries") && data.inquiries) {
    const r = validList(data.inquiries, inquirySchema);
    store.inquiries = r.ok as Inquiry[];
    summary.push({ section: SECTION_LABEL.inquiries, imported: r.ok.length, skipped: r.skipped });
  }
  if (Object.keys(store).length) await importStoreData(store, mode);

  if (want.has("services") && data.services) {
    const r = servicesContentSchema.safeParse(data.services);
    if (r.success) await saveServicesContent(r.data);
    summary.push({ section: SECTION_LABEL.services, imported: Number(r.success), skipped: Number(!r.success), note: r.success ? undefined : "content didn't validate" });
  }
  // Jobs before applications, so applications can link to them.
  if (want.has("jobs") && data.jobs) {
    const r = validList(data.jobs, jobSchema);
    await importJobs(r.ok as JobPost[], mode);
    summary.push({ section: SECTION_LABEL.jobs, imported: r.ok.length, skipped: r.skipped });
  }
  if (want.has("applications") && data.applications) {
    const r = validList(data.applications, applicationSchema);
    const resumes = new Map<string, { data: Buffer; mimeType: string; fileName: string }>();
    for (const [id, f] of Object.entries(files.resumes ?? {})) {
      if (!f || typeof f !== "object" || typeof f.base64 !== "string" || typeof f.fileName !== "string") continue;
      const ok = checkResumeBytes(Buffer.from(f.base64, "base64"), f.fileName.replace(/[^\w.\- ]+/g, "").slice(0, 90) || "resume.pdf");
      if (ok) resumes.set(id, ok);
    }
    const withResume = await importApplications(r.ok as Application[], resumes, mode);
    summary.push({ section: SECTION_LABEL.applications, imported: r.ok.length, skipped: r.skipped, note: `${withResume} with resumes` });
  }
  return summary;
}
