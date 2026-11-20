import type { PoolClient } from "pg";

/**
 * A seeder copies starter content into the database exactly once.
 *
 * `flag` is the app_meta key that records "this seed already ran". The runner claims the
 * flag and runs the seeder in one transaction, so:
 *   - a restart never looks at the content again (admin edits can't be overwritten);
 *   - if `run` throws, the flag is rolled back too and the seed is retried next start.
 *
 * Keep `run` insert-only (use ON CONFLICT DO NOTHING): it must never replace existing rows.
 */
export type Seeder = {
  /** Short name, used in logs. */
  name: string;
  /** app_meta key. Never rename once released, or the seed would run again. */
  flag: string;
  run: (client: PoolClient) => Promise<void>;
};
