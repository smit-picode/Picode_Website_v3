import "server-only";

import { privacyPolicy, termsOfService, type LegalDocument } from "@/lib/content/legal";
import { legalDocSchema, type LegalKey } from "@/lib/content/legal-schema";
import { query } from "@/lib/server/db";

/**
 * Editable /privacy and /terms text, stored as JSON in site_content
 * (keys "legal-privacy" / "legal-terms").
 *
 * The first-time copy of the built-in text lives in lib/server/seeds/legal.seed.ts; it runs
 * once (flag in app_meta) when the database is first used, so edits here are never overwritten.
 */
const DEFAULTS: Record<LegalKey, LegalDocument> = { privacy: privacyPolicy, terms: termsOfService };
const rowKey = (key: LegalKey) => `legal-${key}`;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const defaultLegalDocument = (key: LegalKey): LegalDocument => clone(DEFAULTS[key]);

/** The live document. Falls back to the built-in text if the database can't be used. */
export async function getLegalDocument(key: LegalKey): Promise<LegalDocument> {
  try {
    const { rows } = await query<{ data: unknown }>("SELECT data FROM site_content WHERE key = $1", [rowKey(key)]);
    if (!rows[0]) return defaultLegalDocument(key);
    const parsed = legalDocSchema.safeParse(rows[0].data);
    if (parsed.success) return parsed.data;
    console.error(`[legal] Stored ${key} content is invalid; using defaults.`, parsed.error.issues[0]);
    return defaultLegalDocument(key);
  } catch (error) {
    console.error(`[legal] Could not load ${key} content:`, error);
    return defaultLegalDocument(key);
  }
}

/** For the admin editor: same as above, but throws if the database is unreachable. */
export async function getLegalDocumentForAdmin(key: LegalKey): Promise<LegalDocument> {
  const { rows } = await query<{ data: unknown }>("SELECT data FROM site_content WHERE key = $1", [rowKey(key)]);
  const parsed = rows[0] ? legalDocSchema.safeParse(rows[0].data) : null;
  return parsed?.success ? parsed.data : defaultLegalDocument(key);
}

export async function saveLegalDocument(key: LegalKey, doc: LegalDocument) {
  await query(
    `INSERT INTO site_content (key, data, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [rowKey(key), JSON.stringify(doc)],
  );
}

/** Puts the original built-in text back (an explicit admin action). */
export async function resetLegalDocument(key: LegalKey) {
  await saveLegalDocument(key, defaultLegalDocument(key));
}
