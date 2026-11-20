import "server-only";

import { randomUUID } from "node:crypto";
import {
  RESUME_MAX_BYTES,
  type Application,
  type ApplicationInput,
  type ApplicationStatus,
  type JobFormInput,
  type JobPost,
} from "@/lib/content/careers";
import { query, transaction } from "@/lib/server/db";

/* ------------------------------------------------------------------ */
/* Jobs                                                                 */
/* ------------------------------------------------------------------ */

type JobRow = {
  id: string;
  title: string;
  team: string;
  location: string;
  employment_type: string;
  experience: string;
  summary: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  skills: string[];
  published: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

const toJob = (r: JobRow): JobPost => ({
  id: r.id,
  title: r.title,
  team: r.team,
  location: r.location,
  employmentType: r.employment_type,
  experience: r.experience,
  summary: r.summary,
  about: r.about,
  responsibilities: r.responsibilities,
  requirements: r.requirements,
  niceToHave: r.nice_to_have,
  skills: r.skills,
  published: r.published,
  sortOrder: r.sort_order,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
});

export async function listJobs({ publishedOnly = false } = {}): Promise<JobPost[]> {
  const { rows } = await query<JobRow>(
    `SELECT * FROM jobs ${publishedOnly ? "WHERE published" : ""} ORDER BY sort_order, created_at`,
  );
  return rows.map(toJob);
}

export async function getJob(id: string, { publishedOnly = false } = {}): Promise<JobPost | null> {
  const { rows } = await query<JobRow>(`SELECT * FROM jobs WHERE id = $1 ${publishedOnly ? "AND published" : ""}`, [id]);
  return rows[0] ? toJob(rows[0]) : null;
}

/** Creates or updates a post. `originalId` is the post being edited (its id may be renamed). */
export async function saveJob(input: JobFormInput, originalId?: string) {
  const values = [
    input.id,
    input.title,
    input.team,
    input.location,
    input.employmentType,
    input.experience,
    input.summary,
    input.about,
    input.responsibilities,
    input.requirements,
    input.niceToHave,
    input.skills,
    input.published,
  ];
  if (originalId) {
    const { rowCount } = await query(
      `UPDATE jobs SET id=$1, title=$2, team=$3, location=$4, employment_type=$5, experience=$6, summary=$7, about=$8,
              responsibilities=$9, requirements=$10, nice_to_have=$11, skills=$12, published=$13, updated_at=now()
        WHERE id=$14`,
      [...values, originalId],
    );
    if (rowCount) return;
  }
  await query(
    `INSERT INTO jobs (id, title, team, location, employment_type, experience, summary, about,
                       responsibilities, requirements, nice_to_have, skills, published, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM jobs))`,
    values,
  );
}

export async function jobIdTaken(id: string, exceptId?: string) {
  const { rowCount } = await query("SELECT 1 FROM jobs WHERE id = $1 AND id IS DISTINCT FROM $2", [id, exceptId ?? null]);
  return Boolean(rowCount);
}

export async function setJobPublished(id: string, published: boolean) {
  await query("UPDATE jobs SET published=$2, updated_at=now() WHERE id=$1", [id, published]);
}

/** Applications keep their job title (job_id becomes NULL via ON DELETE SET NULL). */
export async function deleteJob(id: string) {
  await query("DELETE FROM jobs WHERE id=$1", [id]);
}

export async function moveJob(id: string, direction: -1 | 1) {
  await transaction(async (c) => {
    const { rows } = await c.query<{ id: string }>("SELECT id FROM jobs ORDER BY sort_order, created_at FOR UPDATE");
    const ids = rows.map((r) => r.id);
    const i = ids.indexOf(id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    for (const [k, jid] of ids.entries()) await c.query("UPDATE jobs SET sort_order=$2 WHERE id=$1", [jid, k]);
  });
}

/* ------------------------------------------------------------------ */
/* Resumes                                                              */
/* ------------------------------------------------------------------ */

export class ResumeError extends Error {}

const RESUME_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

/** Identify the format from its magic bytes — never trust the name or MIME type. */
function sniffResume(buf: Buffer, name: string): keyof typeof RESUME_TYPES | null {
  if (buf.length < 8) return null;
  if (buf.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  if (buf.readUInt32BE(0) === 0xd0cf11e0 && buf.readUInt32BE(4) === 0xa1b11ae1) return "doc";
  // DOCX is a zip; require the .docx name and a word/ part inside so random zips are refused.
  if (buf.readUInt32BE(0) === 0x504b0304 && /\.docx$/i.test(name) && buf.includes("word/")) return "docx";
  return null;
}

export async function readResume(file: File) {
  if (file.size === 0) throw new ResumeError("That file is empty.");
  if (file.size > RESUME_MAX_BYTES) throw new ResumeError("Resumes must be 5 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffResume(buf, file.name);
  if (!kind) throw new ResumeError("Upload your resume as a PDF or Word document (.pdf, .doc, .docx).");
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .slice(0, 80);
  return { data: buf, mimeType: RESUME_TYPES[kind], fileName: `${base || "resume"}.${kind}` };
}

/* ------------------------------------------------------------------ */
/* Applications                                                         */
/* ------------------------------------------------------------------ */

type ApplicationRow = {
  id: string;
  job_id: string | null;
  job_title: string | null;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  experience_years: string;
  current_title: string;
  skills: string[];
  languages: string[];
  work_mode: string;
  notice_period: string;
  linkedin: string;
  portfolio: string;
  note: string;
  status: ApplicationStatus;
  created_at: Date;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
};

const toApplication = (r: ApplicationRow): Application => ({
  id: r.id,
  jobId: r.job_id,
  jobTitle: r.job_title,
  name: r.name,
  email: r.email,
  phone: r.phone,
  city: r.city,
  country: r.country,
  experienceYears: Number(r.experience_years),
  currentTitle: r.current_title,
  skills: r.skills,
  languages: r.languages,
  workMode: r.work_mode,
  noticePeriod: r.notice_period,
  linkedin: r.linkedin,
  portfolio: r.portfolio,
  note: r.note,
  status: r.status,
  createdAt: r.created_at.toISOString(),
  resume: r.file_name ? { fileName: r.file_name, mimeType: r.mime_type ?? "", sizeBytes: r.size_bytes ?? 0 } : null,
});

export async function createApplication(
  input: ApplicationInput,
  job: JobPost | null,
  resume: { data: Buffer; mimeType: string; fileName: string },
  meta: { ip: string; userAgent: string | null },
): Promise<Application> {
  const id = randomUUID();
  await transaction(async (c) => {
    await c.query(
      `INSERT INTO job_applications (id, job_id, job_title, name, email, phone, city, country, experience_years,
                                     current_title, skills, languages, work_mode, notice_period, linkedin, portfolio,
                                     note, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        id,
        job?.id ?? null,
        job?.title ?? null,
        input.name,
        input.email,
        input.phone,
        input.city,
        input.country,
        input.experienceYears,
        input.currentTitle,
        input.skills,
        input.languages,
        input.workMode,
        input.noticePeriod,
        input.linkedin,
        input.portfolio,
        input.note,
        meta.ip,
        meta.userAgent,
      ],
    );
    await c.query(
      "INSERT INTO application_resumes (application_id, file_name, mime_type, size_bytes, data) VALUES ($1,$2,$3,$4,$5)",
      [id, resume.fileName, resume.mimeType, resume.data.length, resume.data],
    );
  });
  return (await getApplication(id))!;
}

const APPLICATION_SELECT = `
  SELECT a.*, r.file_name, r.mime_type, r.size_bytes
    FROM job_applications a
    LEFT JOIN application_resumes r ON r.application_id = a.id`;

export async function listApplications(): Promise<Application[]> {
  const { rows } = await query<ApplicationRow>(`${APPLICATION_SELECT} ORDER BY a.created_at DESC`);
  return rows.map(toApplication);
}

export async function getApplication(id: string): Promise<Application | null> {
  const { rows } = await query<ApplicationRow>(`${APPLICATION_SELECT} WHERE a.id = $1`, [id]);
  return rows[0] ? toApplication(rows[0]) : null;
}

export async function getResumeFile(applicationId: string) {
  const { rows } = await query<{ file_name: string; mime_type: string; data: Buffer; name: string }>(
    `SELECT r.file_name, r.mime_type, r.data, a.name
       FROM application_resumes r JOIN job_applications a ON a.id = r.application_id
      WHERE r.application_id = $1`,
    [applicationId],
  );
  return rows[0] ?? null;
}

export async function setApplicationStatus(id: string, status: ApplicationStatus) {
  await query("UPDATE job_applications SET status=$2 WHERE id=$1", [id, status]);
}

export async function deleteApplication(id: string) {
  await query("DELETE FROM job_applications WHERE id=$1", [id]);
}

export async function countNewApplications() {
  const { rows } = await query<{ n: string }>("SELECT count(*) AS n FROM job_applications WHERE status = 'new'");
  return Number(rows[0]?.n ?? 0);
}

/* ------------------------------------------------------------------ */
/* Export / import                                                      */
/* ------------------------------------------------------------------ */

/** Every resume file (for a full export). */
export async function listResumeFiles() {
  const { rows } = await query<{ application_id: string; file_name: string; mime_type: string; data: Buffer }>(
    "SELECT application_id, file_name, mime_type, data FROM application_resumes",
  );
  return rows;
}

/** Validates bytes from an import file the same way as an upload. */
export function checkResumeBytes(data: Buffer, fileName: string) {
  if (data.length === 0 || data.length > RESUME_MAX_BYTES) return null;
  const kind = sniffResume(data, fileName);
  return kind ? { data, mimeType: RESUME_TYPES[kind], fileName } : null;
}

export async function importJobs(jobs: JobPost[], mode: "merge" | "replace") {
  await transaction(async (c) => {
    if (mode === "replace") await c.query("DELETE FROM jobs");
    for (const j of jobs) {
      await c.query(
        `INSERT INTO jobs (id, title, team, location, employment_type, experience, summary, about,
                           responsibilities, requirements, nice_to_have, skills, published, sort_order, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now())
         ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, team=EXCLUDED.team, location=EXCLUDED.location,
           employment_type=EXCLUDED.employment_type, experience=EXCLUDED.experience, summary=EXCLUDED.summary,
           about=EXCLUDED.about, responsibilities=EXCLUDED.responsibilities, requirements=EXCLUDED.requirements,
           nice_to_have=EXCLUDED.nice_to_have, skills=EXCLUDED.skills, published=EXCLUDED.published,
           sort_order=EXCLUDED.sort_order, updated_at=now()`,
        [
          j.id, j.title, j.team, j.location, j.employmentType, j.experience, j.summary, j.about,
          j.responsibilities, j.requirements, j.niceToHave, j.skills, j.published, j.sortOrder, j.createdAt,
        ],
      );
    }
  });
}

/**
 * Imports applications (and their resumes, when the export included files).
 * Applications pointing at a job that doesn't exist here keep their job title.
 */
export async function importApplications(
  apps: Application[],
  resumes: Map<string, { data: Buffer; mimeType: string; fileName: string }>,
  mode: "merge" | "replace",
) {
  let withResume = 0;
  await transaction(async (c) => {
    if (mode === "replace") await c.query("DELETE FROM job_applications");
    const { rows } = await c.query<{ id: string }>("SELECT id FROM jobs");
    const jobIds = new Set(rows.map((r) => r.id));
    for (const a of apps) {
      await c.query(
        `INSERT INTO job_applications (id, job_id, job_title, name, email, phone, city, country, experience_years,
                                       current_title, skills, languages, work_mode, notice_period, linkedin, portfolio,
                                       note, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET job_id=EXCLUDED.job_id, job_title=EXCLUDED.job_title, name=EXCLUDED.name,
           email=EXCLUDED.email, phone=EXCLUDED.phone, city=EXCLUDED.city, country=EXCLUDED.country,
           experience_years=EXCLUDED.experience_years, current_title=EXCLUDED.current_title, skills=EXCLUDED.skills,
           languages=EXCLUDED.languages, work_mode=EXCLUDED.work_mode, notice_period=EXCLUDED.notice_period,
           linkedin=EXCLUDED.linkedin, portfolio=EXCLUDED.portfolio, note=EXCLUDED.note, status=EXCLUDED.status`,
        [
          a.id, a.jobId && jobIds.has(a.jobId) ? a.jobId : null, a.jobTitle, a.name, a.email, a.phone, a.city, a.country,
          a.experienceYears, a.currentTitle, a.skills, a.languages, a.workMode, a.noticePeriod, a.linkedin, a.portfolio,
          a.note, a.status, a.createdAt,
        ],
      );
      const file = resumes.get(a.id);
      if (file) {
        await c.query(
          `INSERT INTO application_resumes (application_id, file_name, mime_type, size_bytes, data) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (application_id) DO UPDATE SET file_name=EXCLUDED.file_name, mime_type=EXCLUDED.mime_type,
             size_bytes=EXCLUDED.size_bytes, data=EXCLUDED.data`,
          [a.id, file.fileName, file.mimeType, file.data.length, file.data],
        );
        withResume++;
      }
    }
  });
  return withResume;
}
