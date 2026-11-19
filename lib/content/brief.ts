/** Answer options for the contact questionnaire — shared by the wizard, the API schema and the admin. */

export const BRIEF_TYPES = [
  "Website",
  "Mobile app",
  "AI / agents",
  "Dashboard & data",
  "Workflow automation",
  "Modernise legacy",
  "Not sure yet",
] as const;

export const BRIEF_STAGES = ["Just an idea", "Designs ready", "MVP is live", "Scaling up"] as const;

export const BRIEF_TIMELINES = ["ASAP", "1–3 months", "3–6 months", "Flexible"] as const;

export const BRIEF_BUDGETS = ["Under $10k", "$10k–25k", "$25k–50k", "$50k–100k", "$100k+"] as const;
export const BUDGET_UNSURE = "Not sure yet";

export type Brief = {
  types: string[];
  stage?: string;
  timeline?: string;
  budget?: string;
};
