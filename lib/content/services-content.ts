import { z } from "zod";
import { iconName } from "@/lib/content/icon-registry";
import { engagements, faqs, industries, services } from "@/lib/content/services";

/**
 * Services page content as stored in the database (and edited in /admin → Services).
 * Icons are stored by name (see icon-registry.ts). The built-in content in
 * lib/content/services.ts is the default until the first save.
 */

const text = (max: number) => z.string().trim().min(1, "Required").max(max);
const list = (max: number, itemMax = 200) => z.array(text(itemMax)).max(max);
const id = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes")
  .max(60);
const icon = z.string().trim().min(1).max(40);

export const serviceDocSchema = z.object({
  id,
  number: z.string().trim().max(4),
  icon,
  title: text(120),
  short: text(60),
  tagline: text(160),
  summary: text(600),
  capabilities: z.array(z.object({ icon, title: text(120), text: text(400) })).max(10),
  value: z.object({
    headline: text(300),
    outcomes: z.array(z.object({ label: text(60), text: text(240) })).max(6),
  }),
  deliverables: list(12, 100),
});

export const industryDocSchema = z.object({
  id,
  icon,
  name: text(80),
  kicker: text(120),
  intro: text(600),
  challenges: list(8),
  solutions: z.array(z.object({ service: z.string().trim().max(60), text: text(240) })).max(10),
  standards: list(10, 60),
  metric: z.object({ value: text(30), label: text(60) }),
  accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Hex colour like #0d9488"),
});

export const engagementDocSchema = z.object({
  icon,
  name: text(80),
  duration: text(40),
  text: text(400),
  points: list(6, 100),
  featured: z.boolean().optional(),
});

export const faqDocSchema = z.object({ q: text(240), a: text(1500) });

export const servicesContentSchema = z.object({
  services: z.array(serviceDocSchema).min(1, "Keep at least one service").max(12),
  industries: z.array(industryDocSchema).max(20),
  engagements: z.array(engagementDocSchema).max(8),
  faqs: z.array(faqDocSchema).max(30),
});

export type ServiceDoc = z.infer<typeof serviceDocSchema>;
export type IndustryDoc = z.infer<typeof industryDocSchema>;
export type EngagementDoc = z.infer<typeof engagementDocSchema>;
export type FaqDoc = z.infer<typeof faqDocSchema>;
export type ServicesContent = z.infer<typeof servicesContentSchema>;

/** The built-in content, converted to the stored (icon-by-name) shape. */
export function defaultServicesContent(): ServicesContent {
  return {
    services: services.map((s) => ({
      ...s,
      icon: iconName(s.icon),
      capabilities: s.capabilities.map((c) => ({ ...c, icon: iconName(c.icon) })),
      value: { headline: s.value.headline, outcomes: s.value.outcomes.map((o) => ({ ...o })) },
      deliverables: [...s.deliverables],
    })),
    industries: industries.map((i) => ({
      ...i,
      icon: iconName(i.icon),
      challenges: [...i.challenges],
      solutions: i.solutions.map((x) => ({ ...x })),
      standards: [...i.standards],
      metric: { ...i.metric },
    })),
    engagements: engagements.map((e) => ({
      icon: iconName(e.icon),
      name: e.name,
      duration: e.duration,
      text: e.text,
      points: [...e.points],
      ...("featured" in e && e.featured ? { featured: true } : {}),
    })),
    faqs: faqs.map((f) => ({ ...f })),
  };
}
