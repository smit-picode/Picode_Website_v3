import {
  Bot,
  Database,
  Smartphone,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * The four core offerings — the spine of the site (home, /services, Jarvis).
 * Positioning rule from the brief: lead with the business problem and the value,
 * not the technology.
 */
export type OfferingVisual = "agents" | "devices" | "pipeline" | "dashboard";

export type Offering = {
  slug: string;
  index: string;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  /** One-line positioning statement. */
  tagline: string;
  summary: string;
  /** What hurts today — written in the client's words. */
  problems: string[];
  capabilities: { title: string; body: string }[];
  /** Business value, stated as outcomes. */
  value: string;
  outcomes: { label: string; detail: string }[];
  /** Typical engagement shape for this offering. */
  approach: { step: string; body: string }[];
  /** Related accelerator slug. */
  accelerator?: string;
  visual: OfferingVisual;
  /** Tailwind gradient stops for this offering's accent. */
  accent: { from: string; to: string; rgb: string };
};

export const offerings: Offering[] = [
  {
    slug: "agentic-modernization",
    index: "01",
    title: "Agentic Application Modernization",
    shortTitle: "Agentic Modernization",
    icon: Bot,
    tagline: "Turn legacy systems into intelligent, AI-ready platforms.",
    summary:
      "We modernize the applications your business already runs on and build intelligent enterprise applications that combine AI agents, automation and your business workflows, without a risky big-bang rewrite.",
    problems: [
      "Core systems are hard to change, expensive to run and depend on a few people who understand them.",
      "AI pilots never leave the lab because they can't connect to real data, rules and approvals.",
      "Teams switch between disconnected screens to finish a single piece of work.",
    ],
    capabilities: [
      { title: "Legacy modernization & re-engineering", body: "Incremental, strangler-pattern migration of monoliths to modern, maintainable architectures." },
      { title: "AI-enabled business applications", body: "Operational workspaces where people and AI work side by side on real business tasks." },
      { title: "AI agents inside your apps", body: "Agents that read context, call your APIs and act, with guardrails, audit trails and human approval." },
      { title: "Architecture & API modernization", body: "Clean APIs, event-driven integration and cloud-native services that unlock your data." },
      { title: "Workflow orchestration & rules", body: "Business rules, routing and human-in-the-loop approvals designed in from day one." },
    ],
    value: "Improve productivity, reduce operating costs and modernize existing technology investments.",
    outcomes: [
      { label: "Productivity", detail: "Agents handle the repetitive steps, people handle the judgement calls." },
      { label: "Lower run cost", detail: "Retire brittle infrastructure and licences incrementally." },
      { label: "Protected investment", detail: "Keep what works, modernize what holds you back." },
    ],
    approach: [
      { step: "Assess", body: "Map the application landscape, pain points and AI opportunities." },
      { step: "Blueprint", body: "Target architecture, agent design and a phased migration path." },
      { step: "Modernize", body: "Ship in slices. Each release delivers value and reduces risk." },
      { step: "Augment", body: "Embed agents and automation into the modernized workflows." },
    ],
    accelerator: "agentic-starter-kit",
    visual: "agents",
    accent: { from: "from-primary", to: "to-secondary", rgb: "45 212 191" },
  },
  {
    slug: "web-mobile",
    index: "02",
    title: "Custom Web & Mobile Application Development",
    shortTitle: "Web & Mobile Apps",
    icon: Smartphone,
    tagline: "Digital products your customers and teams love to use.",
    summary:
      "We design and engineer scalable, secure and intuitive web and mobile applications, from customer-facing products and SaaS platforms to the portals your employees use every day.",
    problems: [
      "Product ideas stall because there's no team to take them from concept to launch.",
      "Customers expect app-store quality experiences; existing tools feel dated.",
      "Off-the-shelf software forces the business to work around it.",
    ],
    capabilities: [
      { title: "Custom web & enterprise apps", body: "High-performance web applications built on modern, proven stacks." },
      { title: "iOS, Android & cross-platform", body: "Native-quality mobile apps with Flutter, React Native, Swift and Kotlin." },
      { title: "SaaS & digital product engineering", body: "Multi-tenant platforms, subscriptions, analytics and scale built in." },
      { title: "Customer & employee portals", body: "Self-service experiences that reduce support load and lift satisfaction." },
      { title: "End-to-end engineering", body: "UI/UX, frontend, backend and cloud. One accountable team." },
    ],
    value: "Accelerate digital product launches, improve customer experience and enable new business capabilities.",
    outcomes: [
      { label: "Faster launch", detail: "From validated idea to production in focused, milestone-driven releases." },
      { label: "Better experience", detail: "Research-led UX that customers adopt and keep using." },
      { label: "New capabilities", detail: "Products that open new channels and revenue streams." },
    ],
    approach: [
      { step: "Discover", body: "Users, goals and success metrics, before a line of code." },
      { step: "Design", body: "Clickable prototypes validated with real users." },
      { step: "Build", body: "Agile sprints with demos every two weeks." },
      { step: "Launch & grow", body: "Release, measure, iterate. We stay for the long run." },
    ],
    visual: "devices",
    accent: { from: "from-secondary", to: "to-tertiary", rgb: "56 189 248" },
  },
  {
    slug: "workflow-automation",
    index: "03",
    title: "Intelligent Workflow & Process Automation",
    shortTitle: "Workflow Automation",
    icon: Workflow,
    tagline: "Digitize the work that still runs on email, paper and spreadsheets.",
    summary:
      "We build applications that digitize and automate complex, manual or disconnected business processes, with AI that reads documents, routes work and supports decisions.",
    problems: [
      "Approvals get lost in inboxes and nobody knows where a request is.",
      "Skilled people spend hours re-keying data from documents into systems.",
      "Processes span several applications that don't talk to each other.",
    ],
    capabilities: [
      { title: "Workflow digitization & automation", body: "Model, digitize and automate end-to-end processes." },
      { title: "Approval & case management", body: "Configurable approvals, SLAs, escalations and full audit trails." },
      { title: "Document processing & routing", body: "AI extraction from invoices, forms and contracts with smart routing." },
      { title: "AI task execution & decision support", body: "Agents that prepare, recommend and execute tasks under supervision." },
      { title: "Enterprise integration", body: "Connect ERP, CRM and line-of-business systems into one flow." },
    ],
    value: "Reduce manual effort, increase operational efficiency and improve processing speed and quality.",
    outcomes: [
      { label: "Less manual effort", detail: "Automate the repetitive steps across teams." },
      { label: "Faster cycle times", detail: "Requests move automatically to the right person." },
      { label: "Higher quality", detail: "Validation and rules catch errors before they spread." },
    ],
    approach: [
      { step: "Map", body: "Shadow the process, measure the bottlenecks." },
      { step: "Design", body: "Future-state flow, rules and automation candidates." },
      { step: "Automate", body: "Build on our workflow accelerator for speed." },
      { step: "Optimize", body: "Monitor throughput and continuously improve." },
    ],
    accelerator: "workflow-accelerator",
    visual: "pipeline",
    accent: { from: "from-tertiary", to: "to-secondary", rgb: "139 92 246" },
  },
  {
    slug: "data-driven-apps",
    index: "04",
    title: "Data-Driven Applications & Intelligent Platforms",
    shortTitle: "Data-Driven Apps",
    icon: Database,
    tagline: "From scattered data to operational visibility and better decisions.",
    summary:
      "We develop business applications that combine operational data, analytics and intelligent decision-making, so the right people see the right insight at the moment they need to act.",
    problems: [
      "Data lives in silos, so every report is a manual export.",
      "Leaders see what happened last month, not what's happening now.",
      "Insights sit in dashboards nobody opens instead of the tools people work in.",
    ],
    capabilities: [
      { title: "Data-centric enterprise apps", body: "Applications built around trusted, well-modelled business data." },
      { title: "Dashboards & command centers", body: "Interactive, real-time operational views for every level." },
      { title: "Customer 360 & unified views", body: "One integrated picture of customers, assets or operations." },
      { title: "Embedded analytics & AI insights", body: "Predictions and recommendations inside everyday workflows." },
      { title: "Data integration & monitoring", body: "Pipelines, APIs and real-time alerting across systems." },
    ],
    value: "Transform business data into operational visibility, better decisions and actionable outcomes.",
    outcomes: [
      { label: "Visibility", detail: "Live operational picture instead of month-end reports." },
      { label: "Better decisions", detail: "AI-assisted insight where work happens." },
      { label: "Action", detail: "Alerts and workflows that close the loop." },
    ],
    approach: [
      { step: "Audit", body: "Inventory data sources, quality and decisions to support." },
      { step: "Model", body: "Unified data model and integration pipelines." },
      { step: "Visualize", body: "Dashboards and apps designed around decisions." },
      { step: "Activate", body: "Embed AI insights and automated actions." },
    ],
    accelerator: "data-accelerator",
    visual: "dashboard",
    accent: { from: "from-primary", to: "to-tertiary", rgb: "45 212 191" },
  },
];

export function getOffering(slug: string) {
  return offerings.find((o) => o.slug === slug);
}
