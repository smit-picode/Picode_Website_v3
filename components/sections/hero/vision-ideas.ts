/**
 * Content for the hero "project conversation": a client describes a problem,
 * the Picode team proposes a solution, then designs and builds it.
 * Each scenario also drives the live preview of what gets delivered.
 */
export type PreviewKind = "chat" | "mobile" | "dashboard" | "automation";

export type VisionIdea = {
  id: string;
  /** Short label for the suggestion chip. */
  label: string;
  /** Product name shown in the preview. */
  title: string;
  kind: PreviewKind;
  client: { name: string; role: string };
  /** What the client tells us. */
  problem: string;
  /** How the Picode team responds. */
  reply: string;
  /** What we'll deliver, e.g. "Web app + mobile app". */
  deliverable: string;
  /** Scope of the proposed solution. */
  plan: string[];
  result: string;
};

export const visionIdeas: VisionIdea[] = [
  {
    id: "agent",
    label: "Support overload",
    title: "Support Copilot",
    kind: "chat",
    client: { name: "Priya", role: "Head of Support" },
    problem: "Our team gets 2,000 tickets a week — most are the same few questions.",
    reply: "Understood. We'll build an AI assistant that answers those instantly and hands tricky cases to your team.",
    deliverable: "AI support assistant for your website",
    plan: ["Trained on your help-center content", "Smooth hand-off to your agents", "Multilingual, available 24/7"],
    result: "Most FAQs resolved instantly",
  },
  {
    id: "fintech",
    label: "Mobile banking",
    title: "Pocket Wallet",
    kind: "mobile",
    client: { name: "Arjun", role: "Founder" },
    problem: "Our customers want to track spending and pay from their phones.",
    reply: "Makes sense. One cross-platform app with secure sign-in and live spending insights — iOS and Android together.",
    deliverable: "iOS + Android app",
    plan: ["One codebase, both app stores", "Bank-grade login & KYC", "Real-time spending insights"],
    result: "Live on App Store & Play Store",
  },
  {
    id: "dashboard",
    label: "Scattered data",
    title: "Insight Hub",
    kind: "dashboard",
    client: { name: "Neha", role: "COO" },
    problem: "Our numbers live in six different tools. Monthly reports take a week.",
    reply: "We'll connect those sources into one live dashboard, with forecasts your team can rely on.",
    deliverable: "Live analytics web app",
    plan: ["Unify all 6 data sources", "Live KPIs & forecasting", "Role-based access"],
    result: "Decisions on live data, not stale reports",
  },
  {
    id: "automation",
    label: "Manual invoices",
    title: "AutoLedger",
    kind: "automation",
    client: { name: "Rahul", role: "Finance Lead" },
    problem: "We type hundreds of supplier invoices into our ERP by hand every month.",
    reply: "Let's automate it: AI reads each invoice, checks it against your ERP and routes approvals.",
    deliverable: "Invoice automation workflow",
    plan: ["Reads data from any PDF", "Validates against your ERP", "Auto-approves & syncs"],
    result: "Hours of manual entry → minutes",
  },
];

const KEYWORDS: Record<PreviewKind, string[]> = {
  chat: ["chat", "bot", "agent", "assistant", "support", "ticket", "customer service", "question", "helpdesk", "faq"],
  mobile: ["app", "mobile", "ios", "android", "phone", "booking", "appointment", "delivery", "fitness", "shop", "order", "customers"],
  dashboard: ["dashboard", "analytics", "data", "report", "insight", "kpi", "metrics", "numbers", "forecast", "spreadsheet", "excel"],
  automation: ["automat", "workflow", "invoice", "manual", "by hand", "process", "integrat", "sync", "erp", "email", "paperwork"],
};

const REPLIES: Record<PreviewKind, { reply: string; deliverable: string; result: string }> = {
  chat: {
    reply: "Got it. An AI assistant could take most of that load off your team — here's what we'd build.",
    deliverable: "AI assistant for your business",
    result: "Faster answers, happier customers",
  },
  mobile: {
    reply: "Got it. A focused app would solve that for your customers — here's what we'd build.",
    deliverable: "Web + mobile app",
    result: "Live on web, iOS & Android",
  },
  dashboard: {
    reply: "Got it. Bringing that data into one live view would fix it — here's what we'd build.",
    deliverable: "Live analytics web app",
    result: "Clear numbers, in real time",
  },
  automation: {
    reply: "Got it. That's a great fit for automation — here's what we'd build.",
    deliverable: "Automated workflow",
    result: "Hours of manual work → minutes",
  },
};

/** Turns a problem typed by the visitor into a conversation we can play out. */
export function ideaFromPrompt(prompt: string): VisionIdea {
  const text = prompt.toLowerCase();
  const scored = (Object.keys(KEYWORDS) as PreviewKind[])
    .map((kind) => ({ kind, score: KEYWORDS[kind].filter((k) => text.includes(k)).length }))
    .sort((a, b) => b.score - a.score);
  const kind = scored[0]!.score > 0 ? scored[0]!.kind : "mobile";
  const base = visionIdeas.find((i) => i.kind === kind)!;
  const clean = prompt.replace(/\s+/g, " ").trim().slice(0, 120);

  return {
    ...base,
    ...REPLIES[kind],
    id: `custom-${Date.now()}`,
    label: clean,
    title: "Your Solution",
    client: { name: "You", role: "Client" },
    problem: clean,
    plan: ["Scoped around your exact problem", ...base.plan.slice(1)],
  };
}
