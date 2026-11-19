import { z } from "zod";

export const officeSchema = z.object({
  id: z.string().min(1),
  /** Display name, e.g. "Picode India". */
  name: z.string().trim().max(80).default(""),
  /** Short tag shown on the globe beacon and office card, e.g. "BLR". */
  code: z
    .string()
    .trim()
    .max(4, "Use up to 4 letters")
    .regex(/^[A-Za-z]*$/, "Letters only")
    .transform((v) => v.toUpperCase())
    .default(""),
  city: z.string().trim().min(2, "City is required").max(60),
  country: z.string().trim().min(2, "Country is required").max(60),
  /** ISO 3166-1 alpha-2 (shown as a country badge). */
  countryCode: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code")
    .transform((v) => v.toUpperCase()),
  label: z.string().trim().max(40).default(""),
  address: z.string().trim().min(5, "Address is required").max(300),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  email: z.string().trim().email("Enter a valid email").max(120),
  timezone: z.string().trim().max(60).default(""),
  /** Coordinates drive the pin on the contact map. */
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  isHeadquarters: z.boolean().default(false),
});

export type Office = z.infer<typeof officeSchema>;

export const siteSettingsSchema = z.object({
  generalEmail: z.string().trim().email("Enter a valid email"),
  salesEmail: z.string().trim().email("Enter a valid email"),
  careersEmail: z.string().trim().email("Enter a valid email"),
  supportEmail: z.string().trim().email("Enter a valid email"),
  responseTime: z.string().trim().min(2).max(60),
  /** WhatsApp number with country code; the site assistant links to it. Empty = use the HQ office phone. */
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,22}$/, "Use digits with the country code, e.g. +971 50 123 4567")
    .or(z.literal(""))
    .default(""),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export type InquiryStatus = "new" | "read" | "archived";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  /** Answers from the contact questionnaire, when sent through it. */
  brief?: { types: string[]; stage?: string; timeline?: string; budget?: string };
  status: InquiryStatus;
  receivedAt: string;
  ip: string;
  userAgent: string | null;
};

/** Google Maps link that drops a pin on the office's exact coordinates. */
export function mapsUrl(office: Pick<Office, "lat" | "lng">) {
  return `https://www.google.com/maps/search/?api=1&query=${office.lat},${office.lng}`;
}

/** The office's short code, falling back to the first three letters of the city. */
export function officeCode(office: Pick<Office, "code" | "city">) {
  return (office.code || office.city.replace(/[^A-Za-z]/g, "").slice(0, 3)).toUpperCase();
}

/** "12.9716° N, 77.5946° E" */
export function formatCoords(lat: number, lng: number) {
  const f = (v: number) => Math.abs(v).toFixed(4);
  return `${f(lat)}° ${lat >= 0 ? "N" : "S"}, ${f(lng)}° ${lng >= 0 ? "E" : "W"}`;
}

/* ---------------------------- Case studies --------------------------- */

/** Which device mock-ups the showcase renders for a project. */
export const previewKinds = ["both", "web", "mobile"] as const;
export type PreviewKind = (typeof previewKinds)[number];

/** Uploaded images are served from /api/media/<file>; empty = use the generated preview. */
export const MEDIA_PATH_RE = /^\/api\/media\/[\w-]+\.(png|jpe?g|webp|avif)$/;
const mediaPath = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || MEDIA_PATH_RE.test(v), "Invalid image path")
  .default("");

export const caseStudyServiceSchema = z.object({
  title: z.string().trim().min(2, "Add a title").max(60),
  description: z.string().trim().min(5, "Add a short description").max(200),
});

export const caseStudySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Project name is required").max(40),
  /** Eyebrow, e.g. "Fintech · Web & mobile". */
  category: z.string().trim().min(2, "Category is required").max(50),
  headline: z.string().trim().min(2, "Headline is required").max(40),
  headlineAccent: z.string().trim().max(40).default(""),
  summary: z.string().trim().min(10, "Add a short summary").max(320),
  services: z.array(caseStudyServiceSchema).min(1, "Add at least one service").max(3),
  /** Brand colour used for accents, the glow and the generated preview. */
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #0E5A5F"),
  preview: z.enum(previewKinds).default("both"),
  url: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "Use a full URL starting with https://")
    .default(""),
  logo: mediaPath,
  desktopImage: mediaPath,
  mobileImage: mediaPath,
  published: z.boolean().default(true),
  order: z.number().int().default(0),
});

export type CaseStudy = z.infer<typeof caseStudySchema>;
