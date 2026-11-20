import "server-only";

import { getSiteKnowledge, type KnowledgeSection, type SiteKnowledge } from "@/lib/server/jarvis-knowledge";
import { getOffices, getPublicSettings } from "@/lib/server/store";
import { replyWhen } from "@/lib/utils";

/**
 * Brain for the website's Jarvis assistant.
 *
 * A read-only concierge: it only knows Picode's public website and can never
 * act on anything. Its knowledge is read from the site's own pages (see
 * jarvis-knowledge.ts), so it stays current as the website changes.
 *
 * With GEMINI_API_KEY set it answers through Gemini; without it (or if Gemini
 * fails) it answers locally by finding the best-matching section of the site,
 * so the widget always works.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type BrainReply = { reply: string; source: "gemini" | "local" };

// Fast models first (gemini-3.1-flash-lite answered in ~1.9 s consistently;
// the others vary 2–8 s). Free-tier quotas are per model, so a model that
// runs out is stepped over, as the desktop Jarvis does.
const MODELS = (process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.7-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/**
 * Google Search grounding (the desktop Jarvis's "Google knowledge") has its
 * own small quota. When it's used up the request fails fast with 429: answer
 * without search instead, and stop trying search for a while so visitors
 * never wait on a call that will fail.
 */
let searchRestUntil = 0;
const SEARCH_REST_MS = 10 * 60_000;

const MAX_KB_CHARS = 45_000;

type Context = {
  site: SiteKnowledge;
  settings: Awaited<ReturnType<typeof getPublicSettings>>;
  offices: Awaited<ReturnType<typeof getOffices>>;
  /** Where to send people who want to talk: the contact page if live, else the home contact section. */
  contactHref: string;
};

async function context(): Promise<Context> {
  const [site, settings, offices] = await Promise.all([getSiteKnowledge(), getPublicSettings(), getOffices()]);
  const live = new Set(site.pages.map((p) => p.href));
  const contactHref = live.has("/contact") ? "/contact" : site.anchors.get("contact") ?? "/contact";
  return { site, settings, offices, contactHref };
}

function knowledgeText(ctx: Context) {
  const { site, settings, offices } = ctx;
  const lines: string[] = ["# PICODE: knowledge read from the live website"];
  lines.push(`\n## Live pages (the ONLY pages you may link to)`);
  for (const p of site.pages) lines.push(`- ${p.title}: ${p.href}${p.description ? `: ${p.description}` : ""}`);
  if (site.anchors.size) lines.push(`Sections you may link to: ${[...new Set(site.sections.map((s) => s.href).filter((h) => h.includes("#")))].join(", ")}`);
  if (site.comingSoon.length) {
    lines.push(`\n## Coming soon (not live yet: never link to these, say they are coming soon)`);
    lines.push(site.comingSoon.map((c) => `${c.title} (${c.href})`).join("; "));
  }
  lines.push(`\n## Contact`);
  lines.push(`Send people to ${ctx.contactHref}. General: ${settings.generalEmail}. Sales: ${settings.salesEmail}. Careers: ${settings.careersEmail}. Response time: ${settings.responseTime}.`);
  if (offices.length) lines.push(`Offices: ${offices.map((o) => `${o.city}, ${o.country}${o.label ? ` (${o.label})` : ""}`).join("; ")}.`);

  lines.push(`\n## Website content`);
  let size = lines.join("\n").length;
  for (const s of site.sections) {
    const block = `\n### ${s.heading} (link: ${s.href})\n${s.text}`;
    if (size + block.length > MAX_KB_CHARS) break;
    lines.push(block);
    size += block.length;
  }
  return lines.join("\n");
}

function systemPrompt(kb: string) {
  return `You are JARVIS, the friendly holographic AI assistant on Picode's website. You speak with calm, witty, polite British-butler confidence (address the visitor as "sir" or "ma'am" only occasionally, never every line).

GOALS: help visitors understand what Picode does, which offering fits their problem, how to engage, and guide them to contact the team. Be concise: 1 to 4 short sentences, or a few bullet points. Never use em dashes or en dashes; use commas, colons or full stops instead. Your replies may be read aloud, so avoid tables and code blocks.

LANGUAGE: Always reply in the language the visitor is writing or speaking in (Hindi, Gujarati, Arabic, Spanish, French, anything). If they switch language, switch with them. Keep page links exactly as given; translate only the link text.

SPEAKING STYLE: Your replies are spoken aloud by a natural voice, so write the way a warm, confident person talks: short natural sentences, contractions, a friendly opener when it fits ("Good question.", "Happy to help."), no lists of more than four items, no symbols that sound odd when read.

RULES:
- About Picode (services, work, process, team, offices, contact): answer ONLY from the website knowledge below. If you don't know (pricing figures, specific client names, timelines), say so honestly and suggest contacting the team. Never use web search results to describe Picode.
- General or current questions (a technology, an industry trend, news, a definition): you may use Google Search to answer briefly and accurately, then, where it fits naturally, connect it back to how Picode can help.
- When relevant, point to a page or section using markdown links, using ONLY the live pages and section links listed below, e.g. [our offerings](/#offerings). Never link to a "coming soon" page; say it is coming soon instead.
- Never invent clients, numbers, certifications or prices. Anything the site marks as a sample or example must be described as an example scenario.
- You cannot take actions or access the visitor's device. You are a web concierge.
- If asked about yourself: you are Jarvis, built by Picode's engineers as a demonstration of the intelligent applications they build.
- Politely decline harmful requests or long off-topic tasks (writing essays, doing homework, writing code) and steer back to Picode.

${kb}`;
}

/**
 * The language of a message, when its script makes it unambiguous. Lighter
 * models sometimes answer a Hindi question in English despite the prompt; an
 * explicit per-message instruction fixes that. Latin-script languages
 * (Spanish, French…) are left to the model, which detects them reliably.
 */
const SCRIPTS: [RegExp, string][] = [
  [/[ऀ-ॿ]/, "Hindi (Devanagari script; use Marathi or Nepali instead if the visitor wrote in that)"],
  [/[઀-૿]/, "Gujarati"],
  [/[਀-੿]/, "Punjabi (Gurmukhi)"],
  [/[ঀ-৿]/, "Bengali"],
  [/[஀-௿]/, "Tamil"],
  [/[ఀ-౿]/, "Telugu"],
  [/[ಀ-೿]/, "Kannada"],
  [/[ഀ-ൿ]/, "Malayalam"],
  [/[؀-ۿ]/, "the visitor's language (Arabic script: Arabic, Urdu or Persian, whichever they used)"],
  [/[Ѐ-ӿ]/, "the visitor's language (Cyrillic script, e.g. Russian or Ukrainian)"],
  [/[぀-ヿ]/, "Japanese"],
  [/[가-힯]/, "Korean"],
  [/[一-鿿]/, "Chinese"],
  [/[฀-๿]/, "Thai"],
];
function replyLanguage(text: string) {
  return SCRIPTS.find(([re]) => re.test(text))?.[1] ?? null;
}

async function askGemini(turns: ChatTurn[], kb: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const lastUser = [...turns].reverse().find((t) => t.role === "user")?.content ?? "";
  const lang = replyLanguage(lastUser);
  const instruction = systemPrompt(kb) + (lang ? `\n\nREPLY LANGUAGE FOR THIS MESSAGE: ${lang}. Write your whole reply in it.` : "");
  const body = (withSearch: boolean) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
      ...(withSearch ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { temperature: 0.6, maxOutputTokens: 900 },
    });
  const request = (model: string, withSearch: boolean) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: body(withSearch),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  for (const model of MODELS) {
    try {
      const search = Date.now() >= searchRestUntil;
      let res = await request(model, search);
      if (!res.ok && search && (res.status === 429 || res.status === 400)) {
        // Search quota used up (or search unsupported here): answer from the site alone.
        searchRestUntil = Date.now() + SEARCH_REST_MS;
        console.warn(`[jarvis] Google Search unavailable (${model} → HTTP ${res.status}); answering without it for 10 min.`);
        res = await request(model, false);
      }
      if (!res.ok) {
        console.warn(`[jarvis] ${model} → HTTP ${res.status}`);
        continue;
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
      if (text) return text;
    } catch (error) {
      console.warn(`[jarvis] ${model} failed:`, (error as Error).message);
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Local answers: a few fixed intents, then search over the site       */
/* ------------------------------------------------------------------ */
const STOP = new Set(
  "a an the and or but if of to in on at by for with from as is are was were be been am do does did can could would should will shall may might must i me my we our us you your he she it its they them their this that these those what which who whom whose when where why how about into over than then so not no yes hi hello hey please tell show give know want need like just also any some much many more most very really get got have has had use used uses using tell explain describe picode jarvis sir maam".split(" "),
);

const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "").replace(/e$/, "");
const terms = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9&+\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);

/**
 * Everyday words a visitor uses → the words the site uses for the same thing.
 * Only widens a match; it never adds content of its own.
 */
const SYNONYMS: Record<string, string[]> = {
  case: ["work"],
  studies: ["work"],
  portfolio: ["work"],
  projects: ["work"],
  clients: ["work"],
  stack: ["tech", "frontend", "backend"],
  technology: ["tech", "frontend", "backend"],
  tools: ["tech"],
  framework: ["tech"],
  services: ["offerings"],
  offer: ["offerings"],
  process: ["lifecycle"],
  methodology: ["lifecycle"],
  apps: ["application"],
};

// Keys and values go through the same stemming as the question and the site text.
const SYN: Record<string, string[]> = Object.fromEntries(
  Object.entries(SYNONYMS).map(([k, v]) => [stem(k), v.map((w) => stem(w))]),
);

const matches = (words: string[], t: string) => words.filter((w) => w === t || (t.length > 4 && w.startsWith(t))).length;

function search(query: string, sections: KnowledgeSection[]) {
  const q = [...new Set(terms(query))];
  if (!q.length) return [];
  const docs = sections.map((s) => {
    const body = terms(s.text);
    return {
      s,
      head: terms(`${s.heading} ${s.pageTitle}`),
      // The section's link id ("tech", "work", "offerings") describes it too.
      id: terms(s.href.split("#")[1] ?? ""),
      body,
      // A section's opening sentence names its subject ("Vaultwealth is a…"),
      // which beats a passing mention (e.g. the next slide's label in a carousel).
      // Only a real sentence counts (not an address where "india@picode.ai" holds the first dot).
      lead: terms(s.text.match(/^[^.!?]{10,240}[.!?](?=\s|$)/)?.[0] ?? "").slice(0, 25),
      // Long, noisy blocks (forms, mockups) shouldn't win on volume alone.
      density: Math.min(1, Math.sqrt(80 / Math.max(1, body.length))),
    };
  });
  // Rare words say more than common ones: "legacy" (one section) outweighs "app" (many).
  const idfCache = new Map<string, number>();
  const idf = (w: string) => {
    let v = idfCache.get(w);
    if (v === undefined) {
      const df = docs.filter((d) => matches(d.head, w) || matches(d.id, w) || matches(d.body, w)).length;
      v = Math.log(1 + docs.length / (1 + df)) / Math.log(1 + docs.length / 4);
      idfCache.set(w, v);
    }
    return v;
  };
  return docs
    .map(({ s, head, id, body, lead, density }) => {
      const points = (w: string) =>
        (matches(head, w) * 4 + matches(id, w) * 4 + Math.min(matches(body, w), 6) * density + Math.min(matches(lead, w), 1) * 3) * idf(w);
      let score = 0;
      let matched = 0;
      for (const t of q) {
        // A match through a synonym counts half, so one word ("Tech Park")
        // can't score twice for "tech" and for "stack" → "tech".
        const direct = points(t);
        const viaSynonym = Math.max(0, ...(SYN[t] ?? []).map(points)) * 0.5;
        score += Math.max(direct, viaSynonym);
        if (direct || viaSynonym) matched++;
      }
      // Favour sections that cover more of the question, not just one word often.
      return { s, score: score * (matched / q.length) * (s.index ? 0.25 : 1) };
    })
    .filter((r) => r.score >= 1.5)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.s);
}

/** First couple of sentences, kept short enough to read aloud. */
function excerpt(text: string, max = 320) {
  const sentences = text.match(/[^.!?…]+[.!?…]+/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > max && out) break;
    out += s;
  }
  out = out.trim() || text.slice(0, max);
  return out.length > max ? `${out.slice(0, max).replace(/\s+\S*$/, "")}…` : out;
}

type Intent = { test: RegExp; answer: (ctx: Context) => string };

// Specific, fact-based topics first; small talk last, so "hey, can you
// automate approvals?" is answered from the site, not as a greeting.
const intents: Intent[] = [
  {
    test: /who are you|your name|what are you/i,
    answer: () =>
      "I'm Jarvis, a holographic assistant built by Picode's engineers as a small demonstration of the intelligent applications we build. I'm here to help you find your way around.",
  },
  {
    // Answered from the site's own homepage description and headline.
    test: /what (does|do) (picode|you( guys)?) do\b|what is picode|who is picode|tell me about (picode|the company|your company)|about (picode|your company)\s*\??$/i,
    answer: (ctx) => {
      const home = ctx.site.pages.find((p) => p.href === "/");
      const hero = ctx.site.sections.find((s) => s.page === "/" && !s.href.includes("#"));
      const summary = home?.description || (hero ? excerpt(hero.text) : "");
      const where = [...new Map(ctx.site.sections.filter((s) => s.href.includes("#") && !s.index).map((s) => [s.href, s])).values()]
        .slice(0, 3)
        .map((s) => `[${s.heading}](${s.href})`)
        .join(", ");
      return summary
        ? `${summary}${where ? `\nHave a look: ${where}.` : ""}`
        : `Picode builds software for businesses. Ask me about our services or reach the team via [contact](${ctx.contactHref}).`;
    },
  },
  {
    test: /price|pricing|cost|budget|quote|rate card|how much/i,
    answer: (ctx) =>
      `Pricing depends on scope and how we work together, so I'd rather not guess. Share your requirements through [contact](${ctx.contactHref}) or ${ctx.settings.salesEmail} and the team will reply ${replyWhen(ctx.settings.responseTime)}.`,
  },
  {
    test: /career|job|hiring|vacanc|intern|join (you|the team|picode)/i,
    answer: (ctx) => {
      const live = ctx.site.pages.find((p) => p.href === "/careers");
      return live
        ? `You'll find open roles on our [Careers](/careers) page, or email ${ctx.settings.careersEmail}.`
        : `Our careers page is coming soon. In the meantime, send your CV to ${ctx.settings.careersEmail} and the team will get back to you.`;
    },
  },
  {
    test: /where|office|location|based|country|address/i,
    answer: (ctx) =>
      ctx.offices.length
        ? `Our offices: ${ctx.offices.map((o) => `${o.city}, ${o.country}${o.label ? ` (${o.label})` : ""}`).join("; ")}. Details are in the [contact section](${ctx.contactHref}).`
        : `You can find how to reach us in the [contact section](${ctx.contactHref}).`,
  },
  {
    test: /how (fast|quick|quickly|soon|long)\b.*\b(reply|respond|answer|hear|get back)|response time/i,
    answer: (ctx) =>
      `The team replies ${replyWhen(ctx.settings.responseTime)}. The quickest way to reach them is the [contact form](${ctx.contactHref}) or ${ctx.settings.generalEmail}.`,
  },
  {
    test: /contact|e-?mail|phone|call|reach|talk to|meeting|demo|get in touch|start a project|work (together|with (you|picode))|hire (you|picode)|engage/i,
    answer: (ctx) =>
      `Splendid. The quickest route is the [contact form](${ctx.contactHref}), or email ${ctx.settings.generalEmail}. The team responds ${replyWhen(ctx.settings.responseTime)}.`,
  },
];

const smallTalk: Intent[] = [
  {
    test: /jarvis/i,
    answer: () => "At your service. I'm Jarvis. Ask me about Picode's services, our work, or how to start a project.",
  },
  {
    test: /^\s*(hi|hello|hey|good (morning|evening|afternoon)|yo)\b/i,
    answer: () =>
      "Good day. I'm Jarvis, Picode's assistant. Ask me about our services, our work, the technology we use, or how to start a project.",
  },
  {
    test: /thank|thanks|cheers|great|awesome/i,
    answer: () => "My pleasure. Anything else I can help you with?",
  },
];

function fromSite(question: string, ctx: Context): string | null {
  const hits = search(question, ctx.site.sections);
  let best = hits[0];
  if (!best) return null;

  // A question about a whole group: every meaningful word names the group,
  // via its link id ("case studies" → #work) or its heading ("process" →
  // "Lifecycle"). Then list the group's items. A specific word ("which service
  // fits my LEGACY app?") means: answer with the one item that fits.
  const group = ctx.site.sections.filter((s) => s.href === best!.href && !s.index);
  const groupWords = [...terms(best.href.split("#")[1] ?? ""), ...terms(group[0]?.heading ?? "")];
  const namesGroup = (t: string) =>
    [t, ...(SYN[t] ?? [])].some((a) => groupWords.some((w) => w === a || (a.length > 4 && w.startsWith(a))));
  const asked = terms(question);
  const asksForGroup = asked.length > 0 && asked.every(namesGroup);
  if (group.length >= 4 && asksForGroup) {
    const items = group.slice(1, 9).map((s) => `- [${s.heading}](${s.href}): ${excerpt(s.text, 110)}`);
    return `**${group[0]!.heading}**\n${items.join("\n")}\nTell me your challenge and I'll point you to the best fit.`;
  }
  // Otherwise a group intro is mostly labels: answer with the item that best
  // fits the words that are specific to the question ("legacy" in "which
  // service fits my legacy app?"), not the words that just name the group.
  if (group.length >= 2 && group[0] === best) {
    const specific = asked.filter((t) => !namesGroup(t));
    const intro = best;
    best =
      (specific.length ? search(specific.join(" "), group.slice(1))[0] : undefined) ??
      hits.find((h) => h.href === intro.href && h !== intro) ??
      intro;
  }

  const others = hits.slice(1).filter((h) => !h.index && h.href !== best.href && h.heading !== best.heading).slice(0, 2);
  let reply = `**${best.heading}**: ${excerpt(best.text)}\n[Read more](${best.href}).`;
  if (others.length) reply += `\nRelated: ${others.map((o) => `[${o.heading}](${o.href})`).join(", ")}.`;
  return reply;
}

function overview(ctx: Context) {
  const links = ctx.site.pages.map((p) => `[${p.title}](${p.href})`);
  const sections = [...new Map(ctx.site.sections.filter((s) => s.href.includes("#")).map((s) => [s.href, s])).values()]
    .slice(0, 5)
    .map((s) => `[${s.heading}](${s.href})`);
  const where = [...sections, ...links].slice(0, 6).join(", ");
  return `I'm not entirely certain about that one.${where ? ` You might find it here: ${where}.` : ""} Or ask the team directly via [contact](${ctx.contactHref}).`;
}

function askLocal(turns: ChatTurn[], ctx: Context) {
  const last = [...turns].reverse().find((t) => t.role === "user")?.content ?? "";
  const fixed = intents.find((i) => i.test.test(last));
  if (fixed) return fixed.answer(ctx);
  // "How do you work?" asks about the process, not the "work" (case studies) section.
  const question = last.replace(/\bhow (do|does|would|will) (you|picode|it|this|that|your team) work\b/gi, "your process");
  const site = fromSite(question, ctx);
  if (site) return site;
  const talk = smallTalk.find((i) => i.test.test(last));
  if (talk) return talk.answer(ctx);
  return overview(ctx);
}

export async function think(turns: ChatTurn[]): Promise<BrainReply> {
  const ctx = await context();
  const viaGemini = await askGemini(turns, knowledgeText(ctx));
  if (viaGemini) return { reply: viaGemini, source: "gemini" };
  return { reply: askLocal(turns, ctx), source: "local" };
}
