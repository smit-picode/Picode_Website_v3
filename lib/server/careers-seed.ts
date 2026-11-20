import "server-only";

import type { Pool } from "pg";
import { openings } from "@/lib/content/company";

/** Skills shown on each seeded post (and used as suggestions in the apply form). */
const SEED_SKILLS: Record<string, string[]> = {
  fullstack: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "AWS"],
  mobile: ["Flutter", "Dart", "Firebase", "REST APIs", "iOS", "Android"],
  ai: ["Python", "LLMs", "RAG", "Vector databases", "TypeScript", "LangChain"],
  design: ["Figma", "UI design", "UX research", "Prototyping", "Design systems"],
};

/**
 * First run only: copies the starter roles from lib/content/company.ts into the
 * jobs table so the careers page has posts to show. After that, the admin panel
 * is the source of truth: a flag in app_meta makes sure deleted posts never come
 * back (an intentionally empty board stays empty).
 */
export async function seedJobsIfEmpty(pool: Pool) {
  const done = await pool.query("SELECT 1 FROM app_meta WHERE key = 'jobs_seeded'");
  if (done.rowCount) return;
  await pool.query("INSERT INTO app_meta (key, value) VALUES ('jobs_seeded', now()::text) ON CONFLICT DO NOTHING");
  const existing = await pool.query("SELECT 1 FROM jobs LIMIT 1");
  if (existing.rowCount) return;

  for (const [i, j] of openings.entries()) {
    await pool.query(
      `INSERT INTO jobs (id, title, team, location, employment_type, experience, summary, about,
                         responsibilities, requirements, nice_to_have, skills, published, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,$13)
       ON CONFLICT (id) DO NOTHING`,
      [
        j.id,
        j.title,
        j.team,
        j.location,
        j.type,
        j.experience ?? "",
        j.summary,
        j.about ?? "",
        j.responsibilities ?? [],
        j.requirements ?? [],
        j.niceToHave ?? [],
        SEED_SKILLS[j.id] ?? [],
        i,
      ],
    );
  }
}
