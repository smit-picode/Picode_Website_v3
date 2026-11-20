import "server-only";

import type { Pool } from "pg";
import type { Seeder } from "@/lib/server/seeds/types";

/**
 * Runs every seeder that hasn't run yet. Called once per server process, right after the
 * schema is created (see ensureSchema in lib/server/db.ts).
 *
 * It takes the Pool directly (not db.ts helpers) because those wait for the schema/seed step
 * to finish, which would deadlock here.
 *
 * A failing seeder is logged and skipped: it never blocks the site, and since its transaction
 * is rolled back (flag included) it is simply retried on the next start.
 */
export async function runSeeders(pool: Pool, seeders: Seeder[]) {
  for (const seeder of seeders) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const claimed = await client.query(
        "INSERT INTO app_meta (key, value) VALUES ($1, now()::text) ON CONFLICT DO NOTHING RETURNING key",
        [seeder.flag],
      );
      if (claimed.rowCount) await seeder.run(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error(`[seed] "${seeder.name}" failed; it will be retried on the next start:`, error);
    } finally {
      client.release();
    }
  }
}
