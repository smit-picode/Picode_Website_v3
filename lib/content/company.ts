import {
  Blocks,
  Boxes,
  Compass,
  Gauge,
  HeartHandshake,
  Infinity as InfinityIcon,
  Layers,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Engagement models (brief §B)
 * ------------------------------------------------------------------ */
export type EngagementModel = {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  bestFor: string;
  includes: string[];
  commercial: string;
};

export const engagementModels: EngagementModel[] = [
  {
    id: "project",
    title: "Project-Based Delivery",
    icon: Target,
    summary: "End-to-end software development with defined scope, delivery milestones and clear accountability.",
    bestFor: "New products, modernization programmes and well-defined initiatives.",
    includes: ["Discovery & scoping workshop", "Fixed milestones & demos", "Dedicated delivery lead", "QA, launch & warranty"],
    commercial: "Fixed price or milestone-based",
  },
  {
    id: "dedicated",
    title: "Dedicated Teams & Staff Augmentation",
    icon: Users,
    summary: "Full-stack developers, designers and engineers who join your team on time-and-material terms.",
    bestFor: "Scaling capacity fast or filling specialist skills gaps.",
    includes: ["Vetted engineers in days", "Your tools, rituals & timezone overlap", "Flexible ramp up / down", "Picode engineering oversight"],
    commercial: "Time & material, monthly",
  },
  {
    id: "product",
    title: "Ongoing Product Engineering",
    icon: InfinityIcon,
    summary: "Continuous development, maintenance, enhancements and support for the applications you depend on.",
    bestFor: "Live products that need to keep evolving with your business.",
    includes: ["Roadmap-driven releases", "SLA-backed support & monitoring", "Security & dependency upkeep", "Quarterly value reviews"],
    commercial: "Monthly retainer",
  },
];

/* ------------------------------------------------------------------ *
 * Delivery process
 * ------------------------------------------------------------------ */
export const deliveryProcess: { step: string; title: string; body: string; icon: LucideIcon }[] = [
  { step: "01", title: "Discover", icon: Compass, body: "Understand the business problem, users and measurable success criteria." },
  { step: "02", title: "Design", icon: Layers, body: "Architecture, UX and prototypes validated before we build." },
  { step: "03", title: "Build", icon: Blocks, body: "Two-week sprints, AI-assisted engineering and continuous demos." },
  { step: "04", title: "Launch", icon: Rocket, body: "Automated testing, secure deployment and smooth rollout." },
  { step: "05", title: "Evolve", icon: LineChart, body: "Measure outcomes, iterate and scale with you." },
];

/* ------------------------------------------------------------------ *
 * Accelerators (brief §C)
 * status: "prototype" = demonstrable today, "concept" = roadmap.
 * ------------------------------------------------------------------ */
export type Accelerator = {
  slug: string;
  name: string;
  icon: LucideIcon;
  status: "prototype" | "in-development" | "concept";
  tagline: string;
  description: string;
  components: string[];
  speedup: string;
};

export const accelerators: Accelerator[] = [
  {
    slug: "agentic-starter-kit",
    name: "Agentic Application Starter Kit",
    icon: Sparkles,
    status: "prototype",
    tagline: "A production-ready foundation for intelligent business apps.",
    description:
      "Reusable foundation for agents, roles, workflows and integrations, so new intelligent applications start at week four, not week zero.",
    components: ["Agent runtime with tool calling", "Role-based access & audit trail", "Human-in-the-loop approvals", "Connector SDK for enterprise APIs", "Conversation & task UI kit"],
    speedup: "Up to 40% faster to first release",
  },
  {
    slug: "workflow-accelerator",
    name: "Workflow Automation Accelerator",
    icon: Workflow,
    status: "in-development",
    tagline: "Tasks, approvals and notifications, ready to configure.",
    description:
      "Reusable components for task management, approvals, notifications and workflow execution, configurable per client process.",
    components: ["Visual workflow designer", "Approval chains & SLAs", "Notifications (email, Teams, WhatsApp)", "Document intake & AI extraction", "Process analytics"],
    speedup: "Weeks saved on every workflow project",
  },
  {
    slug: "data-accelerator",
    name: "Data Application Accelerator",
    icon: Gauge,
    status: "concept",
    tagline: "Dashboards, search and analytics building blocks.",
    description:
      "Reusable components for dashboards, data integration, search and analytics to deliver data-driven applications faster.",
    components: ["Dashboard & chart library", "Ingestion connectors", "Semantic search", "Natural-language querying", "Alerting engine"],
    speedup: "Faster time-to-insight for data apps",
  },
];

export const acceleratorStatus: Record<Accelerator["status"], { label: string; className: string }> = {
  prototype: { label: "Working prototype", className: "bg-success/10 text-success ring-success/25" },
  "in-development": { label: "In development", className: "bg-secondary/10 text-secondary-strong ring-secondary/25" },
  concept: { label: "Future concept", className: "bg-tertiary/10 text-tertiary ring-tertiary/25" },
};

/* ------------------------------------------------------------------ *
 * Why Picode / values
 * ------------------------------------------------------------------ */
export const differentiators: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Business-first engineering", body: "We start from the problem and the outcome, then choose the technology.", icon: Target },
  { title: "AI-native delivery", body: "AI is built into how we engineer and into what we ship, responsibly.", icon: Sparkles },
  { title: "Reusable accelerators", body: "Proven building blocks mean faster, lower-risk delivery.", icon: Boxes },
  { title: "Security by design", body: "Secure architecture, access control and auditability from day one.", icon: ShieldCheck },
  { title: "One accountable team", body: "Strategy, design, engineering and support under one roof.", icon: HeartHandshake },
];

export const companyValues: { title: string; body: string }[] = [
  { title: "Outcomes over output", body: "We measure success by the business results our software creates." },
  { title: "Craft & curiosity", body: "We care about the details and keep learning, especially in AI." },
  { title: "Radical transparency", body: "Honest estimates, visible progress and no surprises." },
  { title: "Partnership", body: "We act like part of your team, not a vendor across the table." },
];

/* ------------------------------------------------------------------ *
 * Careers
 * ⚠️ Placeholder openings — edit before launch.
 * ------------------------------------------------------------------ */
export type Job = {
  id: string;
  title: string;
  team: string;
  location: string;
  type: string;
  summary: string;
  /** Full-details panel on /careers (optional so a role can ship with just a summary). */
  experience?: string;
  about?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
};

export const openings: Job[] = [
  {
    id: "fullstack",
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    location: "Bengaluru / Hybrid",
    type: "Full-time",
    summary: "Build modern web platforms with React, Next.js, Node and cloud.",
    experience: "4+ years",
    about:
      "You'll own features end to end on the business applications we build for clients, from database and APIs to a polished, fast interface.",
    responsibilities: [
      "Design and build web applications with React, Next.js and Node.js",
      "Design APIs and data models, and integrate with clients' existing systems",
      "Deploy and run applications on cloud platforms with CI/CD",
      "Review code, mentor engineers and keep quality high",
      "Work directly with designers, product owners and clients",
    ],
    requirements: [
      "Strong TypeScript, React and Node.js experience",
      "Hands-on with SQL and/or NoSQL databases and REST or GraphQL APIs",
      "Experience deploying to AWS, Azure or GCP",
      "Clear written and spoken English",
    ],
    niceToHave: ["Experience adding AI features to applications", "Docker and Kubernetes"],
  },
  {
    id: "mobile",
    title: "Mobile Engineer (Flutter)",
    team: "Engineering",
    location: "Bengaluru / Remote",
    type: "Full-time",
    summary: "Ship cross-platform apps used by thousands of customers.",
    experience: "2+ years",
    about:
      "You'll build iOS and Android apps from one Flutter codebase, from the first screen to store release and the updates after it.",
    responsibilities: [
      "Build and maintain cross-platform apps with Flutter and Dart",
      "Connect apps to backend APIs, authentication and push notifications",
      "Publish and update apps on the App Store and Google Play",
      "Keep apps fast, stable and accessible",
    ],
    requirements: [
      "Solid Flutter and Dart experience with at least one published app",
      "State management (Bloc, Riverpod or Provider)",
      "REST API integration and offline data handling",
      "Git and code-review workflows",
    ],
    niceToHave: ["Native iOS (Swift) or Android (Kotlin) experience", "Firebase"],
  },
  {
    id: "ai",
    title: "AI / LLM Application Engineer",
    team: "AI Lab",
    location: "Bengaluru / Hybrid",
    type: "Full-time",
    summary: "Design agents, RAG pipelines and AI features for enterprise apps.",
    experience: "2+ years",
    about:
      "You'll turn large language models into reliable features inside real business applications: assistants, agents and document workflows.",
    responsibilities: [
      "Build AI agents and RAG pipelines on top of client data",
      "Integrate LLM APIs into web applications and workflows",
      "Evaluate quality, cost and latency, and improve them",
      "Put guardrails, logging and access control around AI features",
    ],
    requirements: [
      "Strong Python or TypeScript",
      "Hands-on experience with LLM APIs, embeddings and vector databases",
      "Understanding of prompt design and retrieval techniques",
      "Experience shipping software to production",
    ],
    niceToHave: ["LangChain, LlamaIndex or similar frameworks", "Experience with evaluation tooling"],
  },
  {
    id: "design",
    title: "Product Designer (UI/UX)",
    team: "Design",
    location: "Remote",
    type: "Full-time",
    summary: "Craft research-led experiences across web and mobile.",
    experience: "3+ years",
    about:
      "You'll shape how our clients' web and mobile products look and work, from early research to the final design system handed to engineers.",
    responsibilities: [
      "Run user research and turn findings into flows and wireframes",
      "Design high-fidelity UI and interactive prototypes in Figma",
      "Build and maintain design systems",
      "Work closely with engineers through build and launch",
    ],
    requirements: [
      "A portfolio showing web and mobile product work",
      "Expert Figma skills, including components and prototyping",
      "Understanding of accessibility and responsive design",
    ],
    niceToHave: ["Motion design", "Experience designing dashboards or enterprise tools"],
  },
];

export const perks: string[] = [
  "Work on AI-first projects with modern stacks",
  "Learning budget & certification support",
  "Flexible hybrid working",
  "Health insurance for you & family",
  "Clear growth paths & mentorship",
  "Hack days to build our accelerators",
];
