import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Job posts                                                           */
/* ------------------------------------------------------------------ */

export type JobPost = {
  id: string;
  title: string;
  team: string;
  location: string;
  employmentType: string;
  experience: string;
  summary: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  skills: string[];
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;

const lines = z
  .string()
  .default("")
  .transform((s) =>
    s
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 30),
  );
const tags = z
  .string()
  .default("")
  .transform((s) => uniq(s.split(",").map((t) => t.trim()).filter(Boolean)).slice(0, 30));

/** Admin form → job post. Lists are one item per line; skills are comma-separated. */
export const jobFormSchema = z.object({
  id: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, e.g. senior-backend-engineer")
    .max(60),
  title: z.string().trim().min(3, "Add a job title").max(120),
  team: z.string().trim().min(2, "Add a team").max(60),
  location: z.string().trim().min(2, "Add a location").max(80),
  employmentType: z.string().trim().min(2).max(40),
  experience: z.string().trim().max(40).default(""),
  summary: z.string().trim().min(10, "One line about the role (min. 10 characters)").max(220),
  about: z.string().trim().max(3000).default(""),
  responsibilities: lines,
  requirements: lines,
  niceToHave: lines,
  skills: tags,
  published: z.boolean(),
});
export type JobFormInput = z.infer<typeof jobFormSchema>;

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export const APPLICATION_STATUSES = ["new", "reviewing", "shortlisted", "interview", "hired", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Not a fit",
};

export const WORK_MODES = ["On-site", "Hybrid", "Remote", "Flexible"] as const;
export const NOTICE_PERIODS = ["Immediately", "Within 2 weeks", "1 month", "2 months", "3 months+"] as const;

/** Suggestions only — applicants can type their own. */
export const LANGUAGE_SUGGESTIONS = [
  "English",
  "Hindi",
  "Arabic",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Urdu",
  "French",
  "German",
  "Spanish",
];
export const COUNTRY_SUGGESTIONS = [
  "India",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
  "United Kingdom",
  "United States",
  "Canada",
  "Germany",
  "Singapore",
  "Australia",
];
export const SKILL_SUGGESTIONS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  ".NET",
  "Go",
  "Flutter",
  "React Native",
  "Swift",
  "Kotlin",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "LLMs",
  "RAG",
  "Machine learning",
  "Figma",
  "UI design",
  "UX research",
  "QA automation",
  "DevOps",
  "Project management",
];

export type Application = {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  experienceYears: number;
  currentTitle: string;
  skills: string[];
  languages: string[];
  workMode: string;
  noticePeriod: string;
  linkedin: string;
  portfolio: string;
  note: string;
  status: ApplicationStatus;
  createdAt: string;
  resume: { fileName: string; mimeType: string; sizeBytes: number } | null;
};

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .default("")
  .refine((v) => !v || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Enter a full link starting with https://");

const tagList = (max: number, label: string) =>
  z
    .array(z.string().trim().min(1).max(40))
    .max(max, `Up to ${max} ${label}`)
    .transform((a) => uniq(a));

/** Public apply form (sent as multipart; the resume file is validated separately). */
export const applicationSchema = z.object({
  jobId: z.string().trim().max(60).default(""),
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .default("")
    .refine((v) => !v || /^\+?[\d\s()-]{7,22}$/.test(v), "Use digits with the country code, e.g. +91 98765 43210"),
  city: z.string().trim().min(2, "Where are you based?").max(80),
  country: z.string().trim().min(2, "Which country?").max(80),
  experienceYears: z.coerce.number().min(0).max(50),
  currentTitle: z.string().trim().max(100).default(""),
  skills: tagList(25, "skills").refine((a) => a.length > 0, "Add at least one skill"),
  languages: tagList(10, "languages").refine((a) => a.length > 0, "Add at least one language"),
  workMode: z.string().trim().max(30).default(""),
  noticePeriod: z.string().trim().max(30).default(""),
  linkedin: optionalUrl,
  portfolio: optionalUrl,
  note: z.string().trim().max(3000, "Keep it under 3000 characters").default(""),
  consent: z.literal(true, { errorMap: () => ({ message: "Please agree so we can keep your details" }) }),
  /** Honeypot — must stay empty. */
  website: z.string().max(0).optional().or(z.literal("")),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationFieldErrors = Partial<Record<keyof ApplicationInput | "resume", string>>;

export type ApplyResponse = { ok: true; ref: string } | { ok: false; error: string; fieldErrors?: ApplicationFieldErrors };

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_ACCEPT = ".pdf,.doc,.docx";

function uniq(list: string[]) {
  const seen = new Set<string>();
  return list.filter((v) => {
    const k = v.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
