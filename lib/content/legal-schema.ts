import { z } from "zod";
import type { LegalDocument } from "@/lib/content/legal";

/**
 * Validation for the editable /privacy and /terms documents. The shape matches
 * `LegalDocument` in lib/content/legal.ts (which stays the built-in default).
 */
export const LEGAL_KEYS = ["privacy", "terms"] as const;
export type LegalKey = (typeof LEGAL_KEYS)[number];

export const LEGAL_LABEL: Record<LegalKey, string> = { privacy: "Privacy Policy", terms: "Terms of Service" };
export const LEGAL_PATH: Record<LegalKey, string> = { privacy: "/privacy", terms: "/terms" };

const blockSchema = z.union([
  z.string().trim().min(1, "Paragraph can't be empty").max(4000),
  z.object({ list: z.array(z.string().trim().min(1).max(1000)).min(1, "A list needs at least one item").max(40) }),
]);

export const legalDocSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  eyebrow: z.string().trim().min(1, "Eyebrow is required").max(60),
  summary: z.string().trim().min(1, "Summary is required").max(800),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
  highlights: z
    .array(z.object({ title: z.string().trim().min(1, "Highlight title is required").max(80), text: z.string().trim().min(1, "Highlight text is required").max(300) }))
    .max(6),
  sections: z
    .array(
      z.object({
        id: z
          .string()
          .trim()
          .min(1, "Section id is required")
          .max(60)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Section id: lowercase letters, numbers and dashes only"),
        title: z.string().trim().min(1, "Section title is required").max(160),
        body: z.array(blockSchema).min(1, "Each section needs some text").max(30),
      }),
    )
    .min(1, "Keep at least one section")
    .max(30),
});

export type LegalDoc = z.infer<typeof legalDocSchema>;

/** Compile-time check that the schema and the built-in type describe the same shape. */
export const _shapeCheck: (d: LegalDoc) => LegalDocument = (d) => d;
