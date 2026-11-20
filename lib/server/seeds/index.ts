import "server-only";

import type { Pool } from "pg";
import { legalPrivacySeeder, legalTermsSeeder } from "@/lib/server/seeds/legal.seed";
import { runSeeders } from "@/lib/server/seeds/runner";

/**
 * Database seeders. Each one fills a table with starter content ONCE (guarded by an app_meta
 * flag), so the admin panel's edits are never overwritten on restart.
 *
 * Add a new seeder:
 *   1. create lib/server/seeds/<name>.seed.ts exporting a `Seeder` (see types.ts),
 *   2. add it to the list below.
 * Order matters when one seed depends on another's table.
 *
 * Job posts are intentionally NOT seeded: the admin adds them from the admin panel.
 */
const SEEDERS = [legalPrivacySeeder, legalTermsSeeder];

export const seedDatabase = (pool: Pool) => runSeeders(pool, SEEDERS);
