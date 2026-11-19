/**
 * Case studies & customer video reviews.
 *
 * ⚠️ Every entry with `sample: true` is ILLUSTRATIVE placeholder content and is
 * rendered with a visible "Sample" badge. The brief requires approved,
 * non-confidential information only — replace these with real, client-approved
 * stories (and set `sample: false`) before launch.
 */

export type CaseStudy = {
  slug: string;
  sample: boolean;
  client: string;
  industry: string;
  offering: string; // offering slug
  title: string;
  summary: string;
  problem: string;
  solution: string;
  features: string[];
  results: { value: string; label: string }[];
  stack: string[];
  /** Two-colour gradient for the generated cover art. */
  palette: [string, string];
  year: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "ops-command-center",
    sample: true,
    client: "Regional logistics operator",
    industry: "Logistics",
    offering: "data-driven-apps",
    title: "A real-time operations command center for 300+ vehicles",
    summary:
      "Unified fleet, order and warehouse data into one live command center with AI-driven delay alerts.",
    problem:
      "Dispatchers juggled four systems and spreadsheets to track deliveries. Delays were spotted only after customers complained, and month-end reporting took days of manual work.",
    solution:
      "We integrated telematics, ERP and warehouse data into a single real-time platform: a live map command center, predictive delay alerts and automated customer notifications, with a mobile app for drivers.",
    features: ["Live fleet & order map", "Predictive delay detection", "Automated customer updates", "Driver mobile app", "Self-serve KPI dashboards"],
    results: [
      { value: "35%", label: "fewer late deliveries" },
      { value: "6h", label: "saved per dispatcher / week" },
      { value: "1", label: "screen instead of 4 systems" },
    ],
    stack: ["Next.js", "Node.js", "PostgreSQL", "Flutter", "Azure"],
    palette: ["#2DD4BF", "#0EA5E9"],
    year: "2025",
  },
  {
    slug: "ai-claims-workflow",
    sample: true,
    client: "Mid-size insurance provider",
    industry: "Insurance",
    offering: "workflow-automation",
    title: "AI-assisted claims processing with human approvals",
    summary:
      "Replaced an email-driven claims process with an intelligent workflow that reads documents and routes cases automatically.",
    problem:
      "Claims arrived by email as PDFs and photos. Staff re-typed data into a legacy system, approvals stalled in inboxes and customers waited weeks for decisions.",
    solution:
      "We built a case-management platform with AI document extraction, rules-based routing, an agent that drafts assessments for adjusters and multi-level approvals, integrated with the existing policy system.",
    features: ["AI document extraction", "Smart routing & SLAs", "Agent-drafted assessments", "Multi-level approvals", "Full audit trail"],
    results: [
      { value: "60%", label: "less manual data entry" },
      { value: "3×", label: "faster claim decisions" },
      { value: "100%", label: "auditable approvals" },
    ],
    stack: ["React", "Python", "FastAPI", "LLM agents", "AWS"],
    palette: ["#8B5CF6", "#38BDF8"],
    year: "2025",
  },
  {
    slug: "legacy-portal-modernization",
    sample: true,
    client: "Manufacturing group",
    industry: "Manufacturing",
    offering: "agentic-modernization",
    title: "Modernizing a 15-year-old dealer portal into an AI workspace",
    summary:
      "Incrementally re-engineered a legacy dealer portal into a modern, AI-enabled workspace without downtime.",
    problem:
      "A legacy .NET portal used by 400 dealers was slow, hard to change and impossible to integrate with new AI services.",
    solution:
      "Using a strangler-fig approach we migrated module by module to a modern API and React frontend, then embedded an assistant that answers product and order questions from the dealer's own data.",
    features: ["Zero-downtime migration", "Modern API layer", "Dealer AI assistant", "Responsive mobile UI"],
    results: [
      { value: "70%", label: "faster page loads" },
      { value: "45%", label: "fewer support tickets" },
      { value: "0", label: "hours of downtime" },
    ],
    stack: [".NET", "React", "GraphQL", "Azure OpenAI"],
    palette: ["#14B8A6", "#A78BFA"],
    year: "2024",
  },
];

export type Testimonial = {
  id: string;
  sample: boolean;
  name: string;
  role: string;
  company: string;
  quote: string;
  /** MP4/WebM URL or YouTube/Vimeo embed URL. Empty → the card shows the quote only. */
  videoUrl: string;
  poster?: string;
  duration?: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    sample: true,
    name: "Operations Director",
    role: "Operations Director",
    company: "Logistics client",
    quote: "Picode understood our operation before they wrote a line of code. The command center changed how we run every single day.",
    videoUrl: "",
    duration: "1:24",
  },
  {
    id: "t2",
    sample: true,
    name: "Head of Claims",
    role: "Head of Claims",
    company: "Insurance client",
    quote: "Our team stopped re-typing documents and started making decisions. The AI workflow paid for itself within months.",
    videoUrl: "",
    duration: "0:58",
  },
  {
    id: "t3",
    sample: true,
    name: "CTO",
    role: "Chief Technology Officer",
    company: "Manufacturing client",
    quote: "They modernized a system everyone was afraid to touch, with zero downtime. That's rare.",
    videoUrl: "",
    duration: "1:10",
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
