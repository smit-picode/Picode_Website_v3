import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultCaseStudies, defaultOffices, defaultSettings } from "@/lib/content/defaults";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/format";
import type { StoredSmtp } from "@/lib/content/mail";
import { OPTIONAL_SETTINGS, type CaseStudy, type Inquiry, type InquiryStatus, type Office, type SiteSettings } from "@/lib/content/types";

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
  preferences: Preferences;
  inquiries: Inquiry[];
  caseStudies: CaseStudy[];
  /** Email (SMTP) settings from Admin → Settings. Never exported. */
  smtp?: StoredSmtp;
};

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function seed(): Database {
  return {
    offices: structuredClone(defaultOffices),
    settings: structuredClone(defaultSettings),
    preferences: { ...DEFAULT_PREFERENCES },
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
      settings: { ...base.settings, ...parsed.settings, show: { ...base.settings.show, ...parsed.settings?.show } },
      preferences: { ...base.preferences, ...parsed.preferences },
      smtp: parsed.smtp,
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

/**
 * Settings as the public website should see them: fields switched off in the admin
 * panel come back empty, so every page simply hides them.
 */
export async function getPublicSettings(): Promise<SiteSettings> {
  const s = await getSettings();
  const out = { ...s };
  for (const key of OPTIONAL_SETTINGS) if (!s.show[key]) out[key] = "";
  return out;
}

/** WhatsApp number for buttons: the one set in admin, else the HQ phone — or none if switched off. */
export async function getWhatsAppNumber(): Promise<string> {
  const [s, offices] = await Promise.all([getSettings(), getOffices()]);
  if (!s.show.whatsapp) return "";
  return s.whatsapp || (offices.find((o) => o.isHeadquarters) ?? offices[0])?.phone || "";
}

export function saveSettings(settings: SiteSettings) {
  return mutate((db) => {
    db.settings = settings;
    return settings;
  });
}

/* --------------------------- Preferences --------------------------- */

export async function getPreferences(): Promise<Preferences> {
  return (await readDb()).preferences;
}

export function savePreferences(preferences: Preferences) {
  return mutate((db) => {
    db.preferences = preferences;
  });
}

/* ------------------------------ Email ------------------------------ */

export async function getSmtp(): Promise<StoredSmtp | undefined> {
  return (await readDb()).smtp;
}

export function saveSmtp(smtp: StoredSmtp) {
  return mutate((db) => {
    db.smtp = smtp;
  });
}

/* ------------------------ Export / import -------------------------- */

export type StoreSnapshot = Pick<Database, "settings" | "preferences" | "offices" | "caseStudies" | "inquiries">;

export async function readStoreSnapshot(): Promise<StoreSnapshot> {
  const { settings, preferences, offices, caseStudies, inquiries } = await readDb();
  return { settings, preferences, offices, caseStudies, inquiries };
}

type WithId = { id: string };
function mergeById<T extends WithId>(current: T[], incoming: T[]) {
  const out = [...current];
  for (const item of incoming) {
    const i = out.findIndex((c) => c.id === item.id);
    if (i >= 0) out[i] = item;
    else out.push(item);
  }
  return out;
}

/**
 * Applies imported data to the JSON store in one write. "merge" adds new records and
 * updates ones with the same id; "replace" swaps each provided collection wholesale.
 */
export function importStoreData(data: Partial<StoreSnapshot>, mode: "merge" | "replace") {
  return mutate((db) => {
    if (data.settings) db.settings = data.settings;
    if (data.preferences) db.preferences = data.preferences;
    if (data.offices) {
      db.offices = mode === "replace" ? data.offices : mergeById(db.offices, data.offices);
      // Exactly one headquarters at most.
      let seenHq = false;
      for (const o of [...db.offices].reverse()) {
        if (o.isHeadquarters && seenHq) o.isHeadquarters = false;
        else if (o.isHeadquarters) seenHq = true;
      }
    }
    if (data.caseStudies) {
      db.caseStudies = mode === "replace" ? data.caseStudies : mergeById(db.caseStudies, data.caseStudies);
      [...db.caseStudies].sort((a, b) => a.order - b.order).forEach((c, k) => (c.order = k));
    }
    if (data.inquiries) {
      db.inquiries = mode === "replace" ? data.inquiries : mergeById(db.inquiries, data.inquiries);
      if (db.inquiries.length > 5_000) db.inquiries.splice(0, db.inquiries.length - 5_000);
    }
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
