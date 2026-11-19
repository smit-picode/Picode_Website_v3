import {
  Activity,
  BadgeCheck,
  BarChart3,
  Blocks,
  Bot,
  Building2,
  Cable,
  Cloud,
  Code2,
  FileScan,
  GitBranch,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Layers,
  MonitorSmartphone,
  Network,
  PanelsTopLeft,
  Radar,
  RefreshCcw,
  Route,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  UserCircle2,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type Capability = { icon: LucideIcon; title: string; text: string };

export type Service = {
  id: string;
  number: string;
  icon: LucideIcon;
  title: string;
  short: string;
  tagline: string;
  summary: string;
  capabilities: Capability[];
  value: { headline: string; outcomes: { label: string; text: string }[] };
  deliverables: string[];
};

export const services: Service[] = [
  {
    id: "agentic-modernization",
    number: "01",
    icon: Bot,
    title: "Agentic Application Modernization",
    short: "Agentic Modernization",
    tagline: "Your existing systems, now with a brain.",
    summary:
      "Modernize existing applications and build intelligent enterprise applications that integrate AI, automation and business workflows.",
    capabilities: [
      { icon: RefreshCcw, title: "Legacy modernization & re-engineering", text: "Move ageing systems to modern, maintainable stacks step by step, without a risky big-bang rewrite." },
      { icon: PanelsTopLeft, title: "AI-enabled business applications", text: "Operational workspaces where people and AI work on the same cases, data and decisions." },
      { icon: Bot, title: "AI agents inside your apps", text: "Agents that read, draft, route and act inside the tools your teams already use, with guardrails." },
      { icon: Cable, title: "Architecture & API modernization", text: "Clean service boundaries and well-documented APIs that make every future change cheaper." },
      { icon: GitBranch, title: "Orchestration, rules & approvals", text: "Workflow orchestration with business rules and human approvals exactly where they matter." },
    ],
    value: {
      headline: "Improve productivity, reduce operating costs and modernize existing technology investments.",
      outcomes: [
        { label: "Productivity", text: "Teams spend time on decisions, not data entry." },
        { label: "Operating cost", text: "Less manual work and fewer systems to maintain." },
        { label: "Investment", text: "What already works is kept, extended and made smarter." },
      ],
    },
    deliverables: ["Modernization roadmap", "Target architecture", "Agent & guardrail design", "Incremental releases", "Run-books & handover"],
  },
  {
    id: "web-mobile",
    number: "02",
    icon: MonitorSmartphone,
    title: "Custom Web & Mobile Application Development",
    short: "Web & Mobile Apps",
    tagline: "Products your customers and teams love to use.",
    summary: "Build scalable, secure and intuitive digital applications for businesses and their customers.",
    capabilities: [
      { icon: Code2, title: "Custom web & enterprise apps", text: "Fast, accessible web applications engineered for scale, security and long life." },
      { icon: Smartphone, title: "iOS, Android & cross-platform", text: "Native and cross-platform mobile apps with offline support, push and secure payments." },
      { icon: Layers, title: "SaaS & digital product engineering", text: "Multi-tenant platforms with billing, roles and analytics built in from day one." },
      { icon: UserCircle2, title: "Customer & employee portals", text: "Self-service portals that cut support load and give people what they need, instantly." },
      { icon: Blocks, title: "End-to-end engineering", text: "UI/UX, frontend, backend and cloud from one team, with one accountable owner." },
    ],
    value: {
      headline: "Accelerate digital product launches, improve customer experience and enable new business capabilities.",
      outcomes: [
        { label: "Speed to market", text: "Weekly working demos and a launch plan from week one." },
        { label: "Customer experience", text: "Interfaces tested with real users before we build." },
        { label: "New capabilities", text: "Platforms designed to grow into new products and markets." },
      ],
    },
    deliverables: ["Product discovery", "Design system & prototype", "Web & mobile apps", "App-store releases", "Analytics & monitoring"],
  },
  {
    id: "workflow-automation",
    number: "03",
    icon: Workflow,
    title: "Intelligent Workflow & Process Automation",
    short: "Workflow Automation",
    tagline: "From inbox chaos to processes that run themselves.",
    summary: "Build applications that digitize and automate complex, manual or disconnected business processes.",
    capabilities: [
      { icon: Workflow, title: "Workflow digitization & automation", text: "Paper, spreadsheets and email chains turned into clear, measurable digital flows." },
      { icon: BadgeCheck, title: "Approval & case management", text: "Cases, SLAs, escalations and audit trails, so nothing falls through the cracks." },
      { icon: FileScan, title: "Document processing & routing", text: "AI reads invoices, forms and contracts, extracts the data and sends it to the right place." },
      { icon: Sparkles, title: "AI task execution & decision support", text: "AI handles the routine steps and recommends next actions for the rest." },
      { icon: Network, title: "Integration across your systems", text: "Connects ERP, CRM, HR and finance tools so data moves without copy-paste." },
    ],
    value: {
      headline: "Reduce manual effort, increase operational efficiency and improve processing speed and quality.",
      outcomes: [
        { label: "Manual effort", text: "Repetitive steps handled automatically, end to end." },
        { label: "Efficiency", text: "Clear queues, owners and SLAs across every team." },
        { label: "Speed & quality", text: "Faster turnaround with fewer errors and full traceability." },
      ],
    },
    deliverables: ["Process mapping", "Automation blueprint", "Workflow platform", "System integrations", "SLA & audit dashboards"],
  },
  {
    id: "data-driven-apps",
    number: "04",
    icon: BarChart3,
    title: "Data-Driven Applications & Intelligent Platforms",
    short: "Data-Driven Apps",
    tagline: "One live picture of your business, and what to do next.",
    summary: "Develop business applications that combine operational data, analytics and intelligent decision-making.",
    capabilities: [
      { icon: Layers, title: "Data-centric enterprise apps", text: "Applications built around trustworthy, well-modelled business data." },
      { icon: LayoutDashboard, title: "Dashboards & command centers", text: "Interactive dashboards and live operational command centers for every level." },
      { icon: Users, title: "Customer 360 & integrated views", text: "Every touchpoint with a customer, partner or asset in one integrated view." },
      { icon: Sparkles, title: "Embedded analytics & AI insights", text: "Forecasts, anomalies and recommendations right where people make decisions." },
      { icon: Activity, title: "Data integration & real-time monitoring", text: "Pipelines that join your sources and alert you the moment something changes." },
    ],
    value: {
      headline: "Make faster, better-informed decisions from one trusted view of the business, and spot risks and opportunities early.",
      outcomes: [
        { label: "Decisions", text: "Answers in seconds instead of reports in days." },
        { label: "One truth", text: "Every team works from the same, trusted numbers." },
        { label: "Foresight", text: "Forecasts and alerts that surface what is coming." },
      ],
    },
    deliverables: ["Data audit & model", "Pipelines & integrations", "Dashboards & command center", "AI insight models", "Monitoring & alerts"],
  },
];

/* ------------------------------------------------------------------ */
/* Industries                                                           */
/* ------------------------------------------------------------------ */

export type Industry = {
  id: string;
  icon: LucideIcon;
  name: string;
  /** Short phrase used in the industry rail. */
  kicker: string;
  intro: string;
  challenges: string[];
  solutions: { service: Service["id"]; text: string }[];
  standards: string[];
  metric: { value: string; label: string };
  accent: string;
};

export const industries: Industry[] = [
  {
    id: "healthcare",
    icon: HeartPulse,
    name: "Healthcare & Medical",
    kicker: "Clinics, hospitals, healthtech",
    intro: "Software that gives clinicians time back and patients a smoother journey, with privacy designed in from the first line.",
    challenges: ["Clinicians buried in admin and duplicate data entry", "Missed appointments and long waiting lists", "Patient data scattered across systems"],
    solutions: [
      { service: "web-mobile", text: "Patient apps for booking, reminders, telehealth and results" },
      { service: "workflow-automation", text: "Referral, intake and claims workflows with AI document processing" },
      { service: "data-driven-apps", text: "Capacity and bed-management command centers" },
      { service: "agentic-modernization", text: "AI assistants that draft notes and summaries for clinicians" },
    ],
    standards: ["HIPAA-aware design", "HL7 / FHIR", "GDPR", "Audit trails"],
    metric: { value: "24/7", label: "patient self-service" },
    accent: "#0d9488",
  },
  {
    id: "finance",
    icon: Landmark,
    name: "Finance & Economics",
    kicker: "Banks, fintech, insurance",
    intro: "Secure, compliant platforms that make money move faster and give leaders a real-time view of risk.",
    challenges: ["Slow onboarding and manual KYC checks", "Legacy core systems that resist change", "Fraud and risk spotted too late"],
    solutions: [
      { service: "agentic-modernization", text: "Modernized core and lending systems with AI agents for case work" },
      { service: "workflow-automation", text: "Digital onboarding, KYC and loan approvals with full audit trails" },
      { service: "data-driven-apps", text: "Risk, fraud and portfolio dashboards with real-time alerts" },
      { service: "web-mobile", text: "Mobile banking, wallets and investor portals" },
    ],
    standards: ["PCI DSS-aware", "KYC / AML flows", "SOC 2 practices", "Strong customer auth"],
    metric: { value: "Real-time", label: "risk visibility" },
    accent: "#0284c7",
  },
  {
    id: "real-estate",
    icon: Building2,
    name: "Real Estate & PropTech",
    kicker: "Developers, brokers, property managers",
    intro: "From first viewing to final handover, digital journeys that sell faster and portfolios that run themselves.",
    challenges: ["Leads lost between portals, calls and spreadsheets", "Manual leasing, maintenance and rent collection", "No single view of a growing portfolio"],
    solutions: [
      { service: "web-mobile", text: "Listing platforms, virtual tours and buyer & tenant apps" },
      { service: "workflow-automation", text: "Leasing, maintenance requests and payment workflows" },
      { service: "data-driven-apps", text: "Portfolio, occupancy and yield dashboards" },
      { service: "agentic-modernization", text: "AI agents that qualify leads and answer property questions" },
    ],
    standards: ["E-signature ready", "Payment gateways", "Map & GIS data", "GDPR"],
    metric: { value: "1 view", label: "of every property" },
    accent: "#7c3aed",
  },
  {
    id: "social",
    icon: Users,
    name: "Social & Community",
    kicker: "Communities, non-profits, creators",
    intro: "Platforms that bring people together safely, and help causes reach and engage more of the people who care.",
    challenges: ["Engagement that fades after sign-up", "Moderation that cannot keep up", "Donor and member data in silos"],
    solutions: [
      { service: "web-mobile", text: "Community, events and donation apps people actually return to" },
      { service: "agentic-modernization", text: "AI-assisted moderation and member support" },
      { service: "data-driven-apps", text: "Engagement and impact dashboards for every campaign" },
      { service: "workflow-automation", text: "Volunteer, grant and membership workflows" },
    ],
    standards: ["Safety & moderation", "Accessibility (WCAG)", "Secure payments", "Privacy controls"],
    metric: { value: "WCAG", label: "accessible by design" },
    accent: "#db2777",
  },
  {
    id: "retail",
    icon: ShoppingBag,
    name: "Retail & E-commerce",
    kicker: "Brands, marketplaces, D2C",
    intro: "Storefronts, loyalty and operations that turn browsers into regulars.",
    challenges: ["Disconnected online and in-store journeys", "Stock and pricing decided on gut feel", "Support teams answering the same questions"],
    solutions: [
      { service: "web-mobile", text: "Headless storefronts, marketplaces and loyalty apps" },
      { service: "data-driven-apps", text: "Demand forecasting and Customer 360" },
      { service: "workflow-automation", text: "Order, returns and supplier workflows" },
      { service: "agentic-modernization", text: "AI shopping and support assistants" },
    ],
    standards: ["PCI DSS-aware", "Headless commerce", "Omnichannel", "GDPR"],
    metric: { value: "360°", label: "customer view" },
    accent: "#ea580c",
  },
  {
    id: "education",
    icon: GraduationCap,
    name: "Education",
    kicker: "Schools, universities, edtech",
    intro: "Learning platforms and campus systems that personalise learning and lighten the admin load.",
    challenges: ["One-size-fits-all learning", "Admissions and records handled on paper", "Little insight into student progress"],
    solutions: [
      { service: "web-mobile", text: "Learning apps and student & parent portals" },
      { service: "agentic-modernization", text: "AI tutors and teaching assistants" },
      { service: "workflow-automation", text: "Admissions, fees and records automation" },
      { service: "data-driven-apps", text: "Progress and early-warning dashboards" },
    ],
    standards: ["Accessibility (WCAG)", "Child-safe data", "LMS integration", "GDPR"],
    metric: { value: "1:1", label: "personalised learning" },
    accent: "#16a34a",
  },
  {
    id: "logistics",
    icon: Truck,
    name: "Logistics & Supply Chain",
    kicker: "Fleets, warehouses, 3PL",
    intro: "Live visibility from warehouse to doorstep, and automation for every hand-off in between.",
    challenges: ["No live view of shipments and fleets", "Paper-based proof of delivery", "Delays discovered after customers complain"],
    solutions: [
      { service: "data-driven-apps", text: "Control towers with live tracking and ETA prediction" },
      { service: "web-mobile", text: "Driver and warehouse apps with offline support" },
      { service: "workflow-automation", text: "Dispatch, documents and exception workflows" },
      { service: "agentic-modernization", text: "Route and load optimisation agents" },
    ],
    standards: ["Telematics & IoT", "Offline-first apps", "EDI / API integration", "Audit trails"],
    metric: { value: "Live", label: "shipment tracking" },
    accent: "#0891b2",
  },
  {
    id: "public",
    icon: Route,
    name: "Public Sector",
    kicker: "Government, smart cities",
    intro: "Citizen services that are simple to use, transparent and secure.",
    challenges: ["Long queues for simple services", "Legacy systems that are hard to change", "Little transparency for citizens"],
    solutions: [
      { service: "web-mobile", text: "Citizen portals and service apps" },
      { service: "workflow-automation", text: "Permits, applications and case management" },
      { service: "agentic-modernization", text: "Modernised legacy systems with AI assistants" },
      { service: "data-driven-apps", text: "Smart-city and service dashboards" },
    ],
    standards: ["Accessibility (WCAG)", "Data residency", "Role-based access", "Audit trails"],
    metric: { value: "Online", label: "citizen services" },
    accent: "#4f46e5",
  },
];

/* ------------------------------------------------------------------ */
/* Engagement models & FAQ                                              */
/* ------------------------------------------------------------------ */

export const engagements = [
  {
    icon: Radar,
    name: "Discovery sprint",
    duration: "2–3 weeks",
    text: "Workshops, user research and a clickable prototype, ending with a scoped plan, timeline and estimate.",
    points: ["Problem & user research", "Prototype & architecture", "Fixed-price proposal"],
  },
  {
    icon: Blocks,
    name: "Fixed-scope project",
    duration: "6–16 weeks",
    text: "A defined product or feature set delivered against milestones, with weekly demos and a launch plan.",
    points: ["Agreed scope & milestones", "Weekly working demos", "Launch & handover"],
    featured: true,
  },
  {
    icon: Users,
    name: "Dedicated product team",
    duration: "Ongoing",
    text: "A cross-functional Picode team that works as an extension of yours, scaling up or down as you grow.",
    points: ["PM, design & engineering", "Flexible capacity", "Shared roadmap & KPIs"],
  },
  {
    icon: Cloud,
    name: "Run & evolve",
    duration: "Monthly",
    text: "Monitoring, security updates and continuous improvement for products already in production.",
    points: ["SLA-backed support", "Performance & security", "Monthly improvements"],
  },
];

export const faqs = [
  {
    q: "Can you work with our existing systems instead of replacing them?",
    a: "Yes, and we usually recommend it. We modernize step by step: wrap legacy systems with clean APIs, add AI and automation around them, and replace parts only when it clearly pays off.",
  },
  {
    q: "How do you use AI safely with our data?",
    a: "Your data stays in your environment or approved providers, never used to train public models. Agents run with clear permissions, guardrails and human approvals, and every action is logged.",
  },
  {
    q: "How long does a typical project take?",
    a: "A discovery sprint takes 2–3 weeks. Most first releases ship in 6–16 weeks, and you see working software every week along the way.",
  },
  {
    q: "Which industries do you have experience in?",
    a: "Healthcare, finance, real estate, social and non-profit platforms, retail, education, logistics and the public sector. The patterns behind good software travel well between them.",
  },
  {
    q: "Who owns the code and IP?",
    a: "You do. All code, designs and documentation are yours, delivered in your repositories with a full handover.",
  },
  {
    q: "Do you support the product after launch?",
    a: "Yes. Our Run & evolve plans cover monitoring, security updates and monthly improvements, or we can train your team to take over.",
  },
];
