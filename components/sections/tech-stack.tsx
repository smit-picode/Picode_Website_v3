import * as icons from "simple-icons";
import { type TechCategory } from "@/components/sections/tech-stack-explorer";
import { TechStackStory } from "@/components/sections/tech-stack-story";

type SimpleIcon = { title: string; hex: string; path: string };
type Def = [name: string, iconKey: string | null, use: string, fallbackHex?: string];

/**
 * Icon data is resolved here on the server so only the handful of SVG paths
 * we use are sent to the browser (simple-icons itself is several MB).
 */
const categories: {
  id: string;
  label: string;
  layer: string;
  icon: TechCategory["icon"];
  blurb: string;
  items: Def[];
}[] = [
  {
    id: "frontend",
    layer: "Experience",
    label: "Frontend",
    icon: "layout",
    blurb: "Pixel-perfect, accessible interfaces that load fast and feel effortless.",
    items: [
      ["React", "siReact", "Component architecture"],
      ["Next.js", "siNextdotjs", "SSR, SEO & edge"],
      ["TypeScript", "siTypescript", "Type-safe at scale"],
      ["Tailwind CSS", "siTailwindcss", "Design-system styling"],
      ["Vue.js", "siVuedotjs", "Progressive apps"],
      ["Angular", "siAngular", "Enterprise frontends"],
      ["Framer Motion", "siFramer", "Fluid interactions"],
    ],
  },
  {
    id: "mobile",
    layer: "Experience",
    label: "Mobile",
    icon: "smartphone",
    blurb: "Native-quality iOS and Android apps from a single, maintainable codebase.",
    items: [
      ["Flutter", "siFlutter", "Cross-platform UI"],
      ["React Native", "siReact", "Shared JS codebase"],
      ["Expo", "siExpo", "Rapid delivery & OTA"],
      ["Swift", "siSwift", "Native iOS"],
      ["Kotlin", "siKotlin", "Native Android"],
      ["iOS", "siApple", "App Store releases"],
      ["Android", "siAndroid", "Play Store releases"],
    ],
  },
  {
    id: "backend",
    layer: "Services",
    label: "Backend",
    icon: "server",
    blurb: "Secure, scalable APIs and services designed for reliability under load.",
    items: [
      ["Node.js", "siNodedotjs", "Real-time services"],
      ["Python", "siPython", "APIs & data work"],
      ["Go", "siGo", "High-throughput systems"],
      ["NestJS", "siNestjs", "Structured Node APIs"],
      ["FastAPI", "siFastapi", "Async Python APIs"],
      ["Spring Boot", "siSpringboot", "Enterprise Java"],
      ["GraphQL", "siGraphql", "Flexible data APIs"],
      [".NET", "siDotnet", "Microsoft ecosystems"],
    ],
  },
  {
    id: "ai",
    layer: "Intelligence",
    label: "AI & ML",
    icon: "brain",
    blurb: "LLMs, agents and ML models woven into products — responsibly and measurably.",
    items: [
      ["OpenAI", "siOpenai", "GPT models & tools"],
      ["Anthropic", "siAnthropic", "Claude models"],
      ["LangChain", "siLangchain", "Agents & RAG"],
      ["Hugging Face", "siHuggingface", "Open models"],
      ["PyTorch", "siPytorch", "Custom training"],
      ["TensorFlow", "siTensorflow", "Production ML"],
      ["Ollama", "siOllama", "Private, local LLMs"],
    ],
  },
  {
    id: "cloud",
    layer: "Infrastructure",
    label: "Cloud & DevOps",
    icon: "cloud",
    blurb: "Automated, observable infrastructure so teams ship daily with confidence.",
    items: [
      ["AWS", "siAmazonwebservices", "Cloud infrastructure"],
      ["Google Cloud", "siGooglecloud", "Data & AI platform"],
      ["Azure", null, "Enterprise cloud", "#0078D4"],
      ["Docker", "siDocker", "Containerisation"],
      ["Kubernetes", "siKubernetes", "Orchestration"],
      ["Terraform", "siTerraform", "Infrastructure as code"],
      ["GitHub Actions", "siGithubactions", "CI/CD pipelines"],
      ["Vercel", "siVercel", "Edge deployments"],
    ],
  },
  {
    id: "data",
    layer: "Data",
    label: "Data",
    icon: "database",
    blurb: "From transactional stores to real-time streams and analytics warehouses.",
    items: [
      ["PostgreSQL", "siPostgresql", "Relational core"],
      ["MongoDB", "siMongodb", "Document data"],
      ["Redis", "siRedis", "Caching & queues"],
      ["Apache Kafka", "siApachekafka", "Event streaming"],
      ["Snowflake", "siSnowflake", "Cloud warehouse"],
      ["Databricks", "siDatabricks", "Lakehouse & ML"],
      ["Elasticsearch", "siElasticsearch", "Search & logs"],
      ["Supabase", "siSupabase", "Postgres backends"],
    ],
  },
];

function resolve(): TechCategory[] {
  const lib = icons as unknown as Record<string, SimpleIcon | undefined>;
  const order = ["frontend", "mobile", "ai", "backend", "data", "cloud"];
  const sorted = [...categories].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return sorted.map((c) => ({
    id: c.id,
    label: c.label,
    layer: c.layer,
    icon: c.icon,
    blurb: c.blurb,
    items: c.items.map(([name, key, use, fallbackHex]) => {
      const icon = key ? lib[key] : undefined;
      return {
        name,
        use,
        hex: `#${icon?.hex ?? fallbackHex?.replace("#", "") ?? "64748B"}`,
        path: icon?.path ?? null,
      };
    }),
  }));
}

export function TechStackSection() {
  const data = resolve();
  return (
    <section id="tech" className="relative isolate overflow-clip bg-surface-muted">
      <div aria-hidden className="absolute -right-48 top-10 size-[40rem] bg-glow-secondary opacity-[0.12]" />
      <div aria-hidden className="absolute -left-48 bottom-10 size-[36rem] bg-glow-primary opacity-[0.1]" />
      <TechStackStory categories={data} />
    </section>
  );
}
