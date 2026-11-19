import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultCaseStudies, defaultOffices, defaultSettings } from "@/lib/content/defaults";
import type { CaseStudy, Inquiry, InquiryStatus, Office, SiteSettings } from "@/lib/content/types";

/**
 * Tiny JSON-file data store.
 *
 * Perfect for a single long-running Node server (`next start`, Docker, VPS).
 * On serverless hosts (Vercel/Netlify) the filesystem is read-only/ephemeral —
 * swap these functions for a real database (Postgres, Supabase, Turso…);
 * every caller goes through this module, so nothing else needs to change.
 */
type Database = {
  offices: Office[];
  settings: SiteSettings;
  inquiries: Inquiry[];
  caseStudies: CaseStudy[];
};

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function seed(): Database {
  return {
    offices: structuredClone(defaultOffices),
    settings: structuredClone(defaultSettings),
    inquiries: [],
    caseStudies: structuredClone(defaultCaseStudies),
  };
}

async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    const base = seed();
    return {
      offices: parsed.offices ?? base.offices,
      settings: { ...base.settings, ...parsed.settings },
      inquiries: parsed.inquiries ?? [],
      caseStudies: parsed.caseStudies ?? base.caseStudies,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return seed();
    throw error;
  }
}

/** Serialise writes so concurrent requests can't clobber each other. */
let writeQueue: Promise<unknown> = Promise.resolve();

function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, DB_FILE); // atomic replace
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

/* ----------------------------- Offices ----------------------------- */

export async function getOffices(): Promise<Office[]> {
  const { offices } = await readDb();
  // HQ first, then alphabetical.
  return [...offices].sort(
    (a, b) => Number(b.isHeadquarters) - Number(a.isHeadquarters) || a.city.localeCompare(b.city),
  );
}

export function upsertOffice(office: Office) {
  return mutate((db) => {
    if (office.isHeadquarters) db.offices.forEach((o) => (o.isHeadquarters = false));
    const i = db.offices.findIndex((o) => o.id === office.id);
    if (i >= 0) db.offices[i] = office;
    else db.offices.push(office);
    return office;
  });
}

export function deleteOffice(id: string) {
  return mutate((db) => {
    db.offices = db.offices.filter((o) => o.id !== id);
  });
}

/* ----------------------------- Settings ---------------------------- */

export async function getSettings(): Promise<SiteSettings> {
  return (await readDb()).settings;
}

export function saveSettings(settings: SiteSettings) {
  return mutate((db) => {
    db.settings = settings;
    return settings;
  });
}

/* ---------------------------- Inquiries ---------------------------- */

export async function listInquiries(): Promise<Inquiry[]> {
  const { inquiries } = await readDb();
  return [...inquiries].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export function addInquiry(inquiry: Inquiry) {
  return mutate((db) => {
    db.inquiries.push(inquiry);
    // Keep the file bounded.
    if (db.inquiries.length > 5_000) db.inquiries.splice(0, db.inquiries.length - 5_000);
    return inquiry;
  });
}

export function setInquiryStatus(id: string, status: InquiryStatus) {
  return mutate((db) => {
    const item = db.inquiries.find((q) => q.id === id);
    if (item) item.status = status;
  });
}

export function deleteInquiry(id: string) {
  return mutate((db) => {
    db.inquiries = db.inquiries.filter((q) => q.id !== id);
  });
}

/* --------------------------- Case studies --------------------------- */

const byOrder = (a: CaseStudy, b: CaseStudy) => a.order - b.order || a.name.localeCompare(b.name);

export async function getCaseStudies({ publishedOnly = false } = {}): Promise<CaseStudy[]> {
  const { caseStudies } = await readDb();
  return caseStudies.filter((c) => !publishedOnly || c.published).sort(byOrder);
}

export async function getCaseStudy(id: string): Promise<CaseStudy | undefined> {
  return (await readDb()).caseStudies.find((c) => c.id === id);
}

/** Returns the previous version, so replaced uploads can be cleaned up. */
export function upsertCaseStudy(study: CaseStudy) {
  return mutate((db) => {
    const i = db.caseStudies.findIndex((c) => c.id === study.id);
    const previous = i >= 0 ? db.caseStudies[i] : undefined;
    if (previous) db.caseStudies[i] = { ...study, order: previous.order };
    else db.caseStudies.push({ ...study, order: Math.max(-1, ...db.caseStudies.map((c) => c.order)) + 1 });
    return previous;
  });
}

export function deleteCaseStudy(id: string) {
  return mutate((db) => {
    const removed = db.caseStudies.find((c) => c.id === id);
    db.caseStudies = db.caseStudies.filter((c) => c.id !== id);
    return removed;
  });
}

/** Swap a study with its neighbour in the display order. */
export function moveCaseStudy(id: string, direction: -1 | 1) {
  return mutate((db) => {
    const list = [...db.caseStudies].sort(byOrder);
    const i = list.findIndex((c) => c.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    list.forEach((c, k) => (c.order = k));
    db.caseStudies = list;
  });
}

/** Every uploaded file still referenced by content (used to clean up orphans). */
export async function referencedMedia(): Promise<Set<string>> {
  const { caseStudies } = await readDb();
  return new Set(caseStudies.flatMap((c) => [c.logo, c.desktopImage, c.mobileImage]).filter(Boolean));
}
