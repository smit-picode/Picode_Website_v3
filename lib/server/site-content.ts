import "server-only";

import { defaultServicesContent, servicesContentSchema, type ServicesContent } from "@/lib/content/services-content";
import { query } from "@/lib/server/db";

/**
 * Editable page content kept in PostgreSQL as JSON documents (site_content table).
 * Each document falls back to the built-in defaults until it's saved from the admin.
 */

export async function getServicesContent(): Promise<ServicesContent> {
  try {
    const { rows } = await query<{ data: unknown }>("SELECT data FROM site_content WHERE key = 'services'");
    if (!rows[0]) return defaultServicesContent();
    const parsed = servicesContentSchema.safeParse(rows[0].data);
    if (parsed.success) return parsed.data;
    console.error("[content] Stored services content is invalid; using defaults.", parsed.error.issues[0]);
    return defaultServicesContent();
  } catch (error) {
    // Database down / not configured: the page still renders with the built-in content.
    console.error("[content] Could not load services content:", error);
    return defaultServicesContent();
  }
}

/** Whether the admin has saved custom services content (vs. using the defaults). */
export async function servicesContentIsCustom() {
  const { rowCount } = await query("SELECT 1 FROM site_content WHERE key = 'services'");
  return Boolean(rowCount);
}

export async function saveServicesContent(content: ServicesContent) {
  await query(
    `INSERT INTO site_content (key, data, updated_at) VALUES ('services', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(content)],
  );
}

export async function resetServicesContent() {
  await query("DELETE FROM site_content WHERE key = 'services'");
}
