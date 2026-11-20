import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * PostgreSQL connection (DATABASE_URL). Used for careers data: job posts and
 * applications with their resumes, which must survive deploys and restarts.
 *
 * The pool is cached on globalThis so dev hot-reloads don't open new connections.
 */
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set.");
  }
}

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  if (!globalForDb.pgPool) {
    const local = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
    const useTls = !local && !/sslmode=disable/.test(url);
    globalForDb.pgPool = new Pool({
      // pg treats `sslmode=require` in the URL as full certificate verification and lets it
      // override the `ssl` option below, which breaks hosts with a private CA (e.g. Aiven).
      // Drop it so the explicit `ssl` setting decides; the connection is still encrypted.
      connectionString: useTls ? url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, "") : url,
      max: 5,
      idleTimeoutMillis: 30_000,
      // Hosted Postgres (Neon, Supabase, RDS…) requires TLS; local doesn't.
      ssl: local || /sslmode=disable/.test(url) ? undefined : { rejectUnauthorized: false },
    });
  }
  return globalForDb.pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  await ensureSchema();
  return pool().query<T>(text, params);
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* ------------------------------------------------------------------ */
/* Schema (idempotent; runs once per server process)                   */
/* ------------------------------------------------------------------ */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Editable page content (e.g. the services page) as JSON documents.
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  team             TEXT NOT NULL,
  location         TEXT NOT NULL,
  employment_type  TEXT NOT NULL,
  experience       TEXT NOT NULL DEFAULT '',
  summary          TEXT NOT NULL,
  about            TEXT NOT NULL DEFAULT '',
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  requirements     TEXT[] NOT NULL DEFAULT '{}',
  nice_to_have     TEXT[] NOT NULL DEFAULT '{}',
  skills           TEXT[] NOT NULL DEFAULT '{}',
  published        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id               UUID PRIMARY KEY,
  job_id           TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  job_title        TEXT,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL DEFAULT '',
  city             TEXT NOT NULL DEFAULT '',
  country          TEXT NOT NULL DEFAULT '',
  experience_years NUMERIC(4,1) NOT NULL DEFAULT 0,
  current_title    TEXT NOT NULL DEFAULT '',
  skills           TEXT[] NOT NULL DEFAULT '{}',
  languages        TEXT[] NOT NULL DEFAULT '{}',
  work_mode        TEXT NOT NULL DEFAULT '',
  notice_period    TEXT NOT NULL DEFAULT '',
  linkedin         TEXT NOT NULL DEFAULT '',
  portfolio        TEXT NOT NULL DEFAULT '',
  note             TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'new',
  ip               TEXT,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_applications_created_idx ON job_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS job_applications_job_idx ON job_applications (job_id);

-- Resumes are kept apart so listing applications never loads file bytes.
CREATE TABLE IF NOT EXISTS application_resumes (
  application_id UUID PRIMARY KEY REFERENCES job_applications(id) ON DELETE CASCADE,
  file_name      TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  size_bytes     INTEGER NOT NULL,
  data           BYTEA NOT NULL
);
`;

let ready: Promise<void> | null = null;

function ensureSchema() {
  ready ??= (async () => {
    await pool().query(SCHEMA);
    const { seedDatabase } = await import("@/lib/server/seeds");
    await seedDatabase(pool());
  })().catch((error) => {
    ready = null; // retry on the next request
    throw error;
  });
  return ready;
}
