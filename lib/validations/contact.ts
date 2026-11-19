import { z } from "zod";
import { BRIEF_BUDGETS, BRIEF_STAGES, BRIEF_TIMELINES, BRIEF_TYPES, BUDGET_UNSURE } from "@/lib/content/brief";

/** Structured answers from the contact questionnaire (all optional, so older clients still work). */
export const briefSchema = z.object({
  types: z.array(z.enum(BRIEF_TYPES)).max(BRIEF_TYPES.length).default([]),
  stage: z.enum(BRIEF_STAGES).optional(),
  timeline: z.enum(BRIEF_TIMELINES).optional(),
  budget: z.enum([...BRIEF_BUDGETS, BUDGET_UNSURE]).optional(),
});

/** Shared between the client form and the /api/contact route handler. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(200),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (min. 10 characters)")
    .max(5000, "Message is too long"),
  brief: briefSchema.optional(),
  /** Honeypot — must stay empty. Real users never see this field. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactFieldErrors = Partial<Record<keyof ContactInput, string>>;

export type ContactResponse =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: ContactFieldErrors };
