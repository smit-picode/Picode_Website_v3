/**
 * Fixed questions and answers for the site assistant (no AI calls).
 * Answers support **bold**, [links](/path) and "- " bullet lines.
 *
 * `keys` are regex fragments matched at word starts against the visitor's text
 * (lower-cased), so "price" also matches "prices"/"pricing".
 */

export type FaqTopic = { id: string; label: string };
export type Faq = { id: string; topic: string; q: string; a: string; keys: string[] };

/** Conversational intents: greetings, thanks, "talk to a human"… */
export type Intent = {
  id: string;
  /** Matched against the whole (normalised) message. */
  patterns: RegExp[];
  /** One is picked at random so repeated chit-chat doesn't feel canned. */
  answers: string[];
  /** "lead" starts the name → email hand-off; "topics" re-opens the topic chips. */
  action?: "lead" | "topics";
};

export const FAQ_TOPICS: FaqTopic[] = [
  { id: "about", label: "About Picode" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process & pricing" },
  { id: "work", label: "Our work" },
  { id: "careers", label: "Careers" },
];

export const FAQS: Faq[] = [
  {
    id: "what",
    topic: "about",
    q: "What does Picode do?",
    keys: ["what (do|does) (you|picode|your company)", "what is picode", "about (you|picode|your company)", "tell me (about|more)", "who (are|is) (you guys|picode)", "your company", "what you do"],
    a: "Picode is an AI-native software engineering company. We help businesses:\n- **Modernize** existing applications with AI and automation\n- **Build** custom web and mobile apps\n- **Automate** manual, disconnected processes\n- **Turn data** into dashboards and decisions\n\nSee everything on our [Services page](/services).",
  },
  {
    id: "where",
    topic: "about",
    q: "Where are you based?",
    keys: ["where", "locat", "office", "address", "based", "bengaluru", "bangalore", "dubai", "india", "uae", "visit", "time ?zone"],
    a: "We have two hubs: **Bengaluru, India** and **Dubai, UAE**, so we work across time zones and ship around the clock. You'll find addresses and directions in the [Offices section](/#contact).",
  },
  {
    id: "ai",
    topic: "about",
    q: "What does “AI-native” mean for my project?",
    keys: ["ai\\b", "ai-native", "artificial intelligence", "llm", "gpt", "chatgpt", "machine learning", "\\bml\\b", "copilot", "agent", "genai", "generative"],
    a: "AI is part of every step of how we work: research, design, coding, testing and monitoring. Senior engineers stay accountable for every decision; AI copilots make them faster and more thorough. See the [AI-driven lifecycle](/#ai-native).",
  },
  {
    id: "fit",
    topic: "services",
    q: "Which service fits my project?",
    keys: ["service", "offer", "which (one|service)", "what can you (build|do|make)", "recommend", "suitable", "solution", "help (me|us) with", "can you (build|make|develop|create)", "develop"],
    a: "A quick guide:\n- Old system slowing you down → **Agentic Modernization**\n- New product or app → **Web & Mobile Apps**\n- Too much manual work → **Workflow Automation**\n- Need visibility and insight → **Data-Driven Apps**\n\nNot sure? [Tell us about it](/#contact) and we'll recommend one.",
  },
  {
    id: "legacy",
    topic: "services",
    q: "Can you work with our existing systems?",
    keys: ["legacy", "existing", "old (system|app|software|code)", "moderni[sz]", "migrat", "integrat", "erp", "crm", "sap", "upgrade", "rewrite", "rebuild"],
    a: "Yes, and we usually recommend it. We modernize step by step: wrap legacy systems with clean APIs, add AI and automation around them, and replace parts only when it clearly pays off. More on [Agentic Modernization](/services#agentic-modernization).",
  },
  {
    id: "mobile",
    topic: "services",
    q: "Do you build websites and mobile apps?",
    keys: ["mobile", "apps?\\b", "ios", "android", "iphone", "react native", "flutter", "website", "web ?site", "web app", "portal", "landing page", "e-?commerce", "online store"],
    a: "Yes: websites, web apps and portals, plus native iOS/Android and cross-platform mobile apps, along with the back-ends behind them. See [Web & Mobile Apps](/services#web-mobile).",
  },
  {
    id: "automation",
    topic: "services",
    q: "Can you automate our manual work?",
    keys: ["automat", "manual", "workflow", "repetitive", "spreadsheet", "excel", "invoice", "paperwork", "rpa", "bot\\b"],
    a: "Yes. We connect your tools and add AI where it saves real time, for example:\n- Reading invoices, forms and emails automatically\n- Routing approvals and follow-ups\n- Syncing data between systems so nobody re-types it\n\nSee [Workflow Automation](/services#workflow-automation).",
  },
  {
    id: "data",
    topic: "services",
    q: "Can you build dashboards and data platforms?",
    keys: ["data", "dashboard", "analytic", "report", "insight", "\\bbi\\b", "power ?bi", "kpi", "metric", "forecast", "predict"],
    a: "Yes. We bring scattered data together and turn it into live dashboards, reports and prediction tools your team actually uses. See [Data-Driven Apps](/services#data-driven-apps).",
  },
  {
    id: "design",
    topic: "services",
    q: "Do you do UI/UX design?",
    keys: ["design", "ui\\b", "ux\\b", "figma", "prototype", "wireframe", "brand", "logo"],
    a: "Yes. Product design is part of every build: research, wireframes, clickable prototypes and a polished UI, all in Figma before we write code.",
  },
  {
    id: "tech",
    topic: "services",
    q: "Which technologies do you use?",
    keys: ["tech", "stack", "language", "framework", "react", "next(\\.?js)?\\b(?! step)", "node", "python", "java\\b", "\\.net", "cloud", "aws", "azure", "gcp", "kubernetes", "database"],
    a: "We pick what suits the problem. Common choices include **React/Next.js**, **Flutter** and native mobile, **Node.js** and **Python**, plus AWS, Azure or GCP with Kubernetes. See our full [tech stack](/#tech).",
  },
  {
    id: "industries",
    topic: "services",
    q: "Which industries do you work with?",
    keys: ["industr", "sector", "domain", "health", "medical", "hospital", "clinic", "pharma", "financ", "fintech", "bank", "insurance", "real estate", "property", "retail", "education", "edtech", "school", "logistic", "social", "non-?profit", "ngo", "government", "public sector"],
    a: "Healthcare, finance, real estate, social and non-profit platforms, retail, education, logistics and the public sector. See [Industries](/services#industries).",
  },
  {
    id: "start",
    topic: "process",
    q: "How do we get started?",
    keys: ["get(ting)? started", "start", "begin", "kick ?off", "onboard", "next step", "hire (you|picode)", "work (with you|together)", "engage", "partner", "process", "how (do|does) (it|this) work"],
    a: "It's simple:\n- Fill in the short [project brief](/#contact) (about two minutes)\n- A Picode lead replies within one business day\n- We usually begin with a **2–3 week discovery sprint** that ends in a scoped plan, timeline and estimate",
  },
  {
    id: "time",
    topic: "process",
    q: "How long does a project take?",
    keys: ["how long", "timeline", "duration", "time ?frame", "weeks", "months", "deadline", "how (fast|quick|soon)", "deliver", "launch", "turnaround"],
    a: "A discovery sprint takes **2–3 weeks**. Most first releases ship in **6–16 weeks**, and you see working software every week along the way.",
  },
  {
    id: "cost",
    topic: "process",
    q: "How much does it cost?",
    keys: ["cost", "price", "pricing", "budget", "rates?\\b", "charge", "fees?\\b", "expensive", "cheap", "afford", "quot(e|ation)", "estimate", "how much", "\\$", "dollar", "rupee", "inr", "usd", "aed", "hourly", "payment"],
    a: "It depends on scope. Projects typically range from **under $10k** for focused builds to **$100k+** for larger platforms. Share a few details in the [project brief](/#contact) and we'll come back with an estimate.",
  },
  {
    id: "ip",
    topic: "process",
    q: "Who owns the code?",
    keys: ["own", "intellectual property", "\\bip\\b", "source code", "copyright", "repo"],
    a: "You do. All code, designs and documentation are yours, delivered in your repositories with a full handover.",
  },
  {
    id: "nda",
    topic: "process",
    q: "Will you sign an NDA?",
    keys: ["nda", "non-?disclosure", "confidential", "secur", "privacy", "gdpr", "hipaa", "safe"],
    a: "Yes, happily, before we discuss any details. We also follow secure-by-default practices: least-privilege access, encrypted data and reviewed code, and we work within your compliance needs (e.g. GDPR or HIPAA).",
  },
  {
    id: "support",
    topic: "process",
    q: "Do you support the product after launch?",
    keys: ["support", "maint[ae]n", "after (launch|release)", "bug", "update", "hosting", "monitor", "sla"],
    a: "Yes. Our **Run & evolve** plans cover monitoring, security updates and monthly improvements, or we can train your team to take over.",
  },
  {
    id: "cases",
    topic: "work",
    q: "Can I see your previous work?",
    keys: ["previous", "past", "portfolio", "case stud", "examples?", "projects", "clients", "work you('ve| have) done", "references?", "testimonial", "show me"],
    a: "Of course. Browse our [case studies](/#work): websites, mobile apps and platforms we've designed and built for clients.",
  },
  {
    id: "jobs",
    topic: "careers",
    q: "Are you hiring?",
    keys: ["hiring", "job", "career", "vacanc", "opening", "position", "intern", "apply", "resume", "\\bcv\\b", "join (you|picode|your team)", "work (at|for) (you|picode)"],
    a: "We're always glad to meet great engineers, designers and product people. Visit [Careers](/careers) for open roles.",
  },
];

/** Leading greeting, stripped before matching so "hi, how much does it cost" still finds the FAQ. */
export const GREETING = /^(hi+|hello+|hey+|hiya|hola|namaste|namaskar|salaam|salam|greetings|howdy|yo|sup|good (morning|afternoon|evening|day))\b( there| team| picode| all| guys| folks)?[\s,!.]*/;

export const INTENTS: Intent[] = [
  {
    id: "how-are-you",
    patterns: [/^(how are (you|u)|how('?s| is) it going|how (are )?you doing|what'?s up|wh?ass?up)\b/],
    answers: ["I'm doing great, thanks for asking! 😊 How can I help you today?", "All good here, thank you! What would you like to know about Picode?"],
  },
  {
    id: "thanks",
    patterns: [/^(thanks?|thank (you|u)|thx|ty|cheers|much appreciated|appreciate it|great,? thanks?)\b/],
    answers: ["You're welcome! 😊 Anything else I can help with?", "Happy to help! Let me know if there's anything else."],
  },
  {
    id: "bye",
    patterns: [/^(bye|goodbye|good bye|see (you|ya)|later|take care|that'?s all|nothing else|no,? thanks?|i'?m done)\b/],
    answers: ["Thanks for stopping by! 👋 If anything comes up, I'm right here.", "Bye for now! 👋 Wishing you a great day."],
  },
  {
    id: "ack",
    patterns: [/^(ok(ay)?|k|cool|nice|great|awesome|perfect|got it|alright|sure|yes|yeah|yep|no|nope|fine|hmm+|interesting|wow)[\s!.]*$/],
    answers: ["👍 Anything else you'd like to know? Pick a topic below or just type your question.", "Great! Is there anything else I can help you with?"],
    action: "topics",
  },
  {
    id: "bot",
    patterns: [/\b(are (you|u) (a )?(bot|robot|human|real|ai|person))\b/, /^(who|what) are (you|u)\b/, /\byour name\b/],
    answers: [
      "I'm Picode's virtual assistant. 🙂 I can answer common questions right away, and pass anything else to our team (real humans!), who reply within one business day.",
    ],
  },
  {
    id: "help",
    patterns: [/^(help|menu|options|start over|restart|topics)[\s!.?]*$/, /\bwhat can (you|u) (do|help)\b/, /\bhow can (you|u) help\b/],
    answers: ["Here's what I can help with. Pick a topic below, or type your question in your own words."],
    action: "topics",
  },
  {
    id: "human",
    patterns: [
      /\b(talk|speak|chat|connect) (to|with) (a |an |the |your )?(human|person|someone|real person|agent|team|sales|expert|representative|manager|developer|engineer)\b/,
      /\b(call me|call back|callback|book a (call|meeting)|schedule a (call|meeting)|set up a (call|meeting)|meet you)\b/,
    ],
    answers: ["Of course, I'll connect you with our team. 🙂 First, what's your **name**?"],
    action: "lead",
  },
  {
    id: "contact",
    patterns: [
      /\b(contact (you|picode|us|your team|the team)|get in touch|reach (you|out|picode|your team)|your (email|e-mail|phone|number|contact|whatsapp)|how (can|do) i (contact|reach|call|email|message))\b/,
    ],
    answers: [
      "You can reach us any of these ways:\n- Send a [project brief](/#contact) (about two minutes)\n- Message us on **WhatsApp** using the button below\n- Or tell me your question here and I'll pass it to our team",
    ],
  },
  {
    id: "compliment",
    patterns: [/\b(you('?re| are) (awesome|great|amazing|helpful|cool)|nice (site|website|work)|great (site|website|work|job)|love (it|this|your))\b/],
    answers: ["Thank you, that means a lot to the team! 💙 Is there anything I can help you with?"],
  },
];

/** Picked when a greeting arrives on its own. */
export const GREETING_REPLIES = [
  "Hi there! 👋 How can I help you today? Pick a topic below or ask me anything about Picode.",
  "Hello! 👋 Great to see you. What would you like to know about Picode?",
  "Hey! 👋 I'm here to help. Ask me about our services, pricing or how to get started.",
];
