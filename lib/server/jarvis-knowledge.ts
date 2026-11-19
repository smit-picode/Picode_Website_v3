import "server-only";

import { siteConfig, underDevelopmentRoutes } from "@/lib/site";

/**
 * Jarvis learns Picode from the website itself.
 *
 * Instead of a hand-maintained copy of the site's content, this reads the live
 * public pages (the same HTML visitors get), splits them into sections by
 * heading and remembers where each section lives (e.g. "/#offerings"). When a
 * page or its copy changes, Jarvis picks it up on the next refresh — there is
 * nothing to keep in sync.
 *
 * - Pages: everything in /sitemap.xml (live pages only; "under development"
 *   placeholders are excluded there) plus internal links found while reading.
 * - Never read: /admin, /api, files, and pages marked noindex.
 * - Origin: always this server (loopback) or the configured site URL — never a
 *   value from the visitor's request, so a request can't point the reader at
 *   another host.
 * - Cached for 10 minutes; a stale copy is served while a fresh one is built.
 */

export type KnowledgeSection = {
  /** Page path, e.g. "/". */
  page: string;
  pageTitle: string;
  /** Deep link to the section, e.g. "/#offerings". */
  href: string;
  heading: string;
  text: string;
  /** From a page that lists other pages (e.g. the sitemap) rather than describing Picode. */
  index?: boolean;
};

export type SiteKnowledge = {
  pages: { href: string; title: string; description: string }[];
  sections: KnowledgeSection[];
  /** Routes in navigation that are not live yet. */
  comingSoon: { href: string; title: string }[];
  /** Ids present on the pages, e.g. "contact" → "/#contact". */
  anchors: Map<string, string>;
  builtAt: number;
};

const TTL_MS = 10 * 60_000;
const MAX_PAGES = 30;
const PAGE_TIMEOUT_MS = 25_000; // generous: in dev a cold page compiles on first hit
const MAX_SECTION_CHARS = 1_500;

const origins = () =>
  [
    process.env.JARVIS_CRAWL_ORIGIN,
    `http://127.0.0.1:${process.env.PORT ?? 3000}`,
    siteConfig.url,
  ]
    .filter((o): o is string => !!o)
    .map((o) => o.replace(/\/+$/, ""));

/* ------------------------------------------------------------------ */
/* HTML → text                                                         */
/* ------------------------------------------------------------------ */
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·", rarr: "→", larr: "←", mdash: "—", ndash: "–", hellip: "…", copy: "©" };

function decode(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1]?.toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const clean = (s: string) =>
  decode(s)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])(?=\s|$)/g, "$1") // "Vision , Our" → "Vision, Our" (left by removed markup)
    .trim();

const BLOCK = new Set(["p", "div", "li", "ul", "ol", "br", "dd", "dt", "dl", "tr", "td", "th", "h4", "h5", "h6", "article", "section", "figure", "figcaption", "blockquote", "button", "label", "header", "footer", "nav", "form"]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
/** Framework-generated or utility ids that are never useful link targets. */
const NOT_AN_ANCHOR = /:|^main$|^radix-|^headlessui-/;

/** Ids the site itself links to with "#id" (nav, footer, sitemap…): these are real destinations. */
function linkedIds(html: string) {
  return [...html.matchAll(/href="[^"#]*#([^"]+)"/g)].map((m) => decode(m[1]!)).filter((id) => !NOT_AN_ANCHOR.test(id));
}

type Parsed = { title: string; description: string; noindex: boolean; sections: { anchor?: string; heading: string; text: string }[]; links: string[]; ids: string[] };

/**
 * Splits a page into sections by h1–h3. Each section links to the innermost
 * element around it that is a real destination: a <section id> or an id the
 * site links to (so the contact form maps to "/#contact", not its wrapper).
 */
function parsePage(html: string, linkable: Set<string>): Parsed {
  const title = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = clean(html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] ?? "");
  const noindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html);

  // Only the page's own content: header/footer chrome lives outside <main>.
  const start = html.search(/<main[\s>]/i);
  const end = html.lastIndexOf("</main>");
  let body = start >= 0 && end > start ? html.slice(start, end) : html;
  body = body
    .replace(/<!--[\s\S]*?-->/g, "") // React's text separators
    .replace(/<(script|style|svg|noscript|template|iframe|canvas|video)\b[\s\S]*?<\/\1>/gi, " ");

  const links = [...body.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((m) => decode(m[1]!));
  const ids = [...body.matchAll(/<[a-z][a-z0-9]*\b[^>]*\sid="([^"]+)"/gi)].map((m) => m[1]!).filter((id) => !NOT_AN_ANCHOR.test(id));

  const sections: Parsed["sections"] = [];
  const stack: { tag: string; anchor?: string }[] = [];
  let anchor: string | undefined;
  let heading = "";
  let buf: string[] = [];
  let inHeading = false;
  let headingBuf: string[] = [];

  const flush = () => {
    const text = clean(buf.join(" "));
    if (heading || text) sections.push({ anchor, heading, text });
    buf = [];
  };
  const innermostAnchor = () => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i]!.anchor) return stack[i]!.anchor;
    return undefined;
  };

  for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)/g)) {
    const [, closing, rawTag, attrs = "", text] = m;
    if (text !== undefined) {
      (inHeading ? headingBuf : buf).push(text);
      continue;
    }
    const tag = rawTag!.toLowerCase();
    if (!closing) {
      if (!VOID.has(tag) && !attrs.trimEnd().endsWith("/")) {
        const id = attrs.match(/\sid="([^"]+)"/)?.[1];
        const isAnchor = !!id && !NOT_AN_ANCHOR.test(id) && (tag === "section" || linkable.has(id));
        stack.push({ tag, anchor: isAnchor ? id : undefined });
      }
    } else {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.tag === tag) {
          stack.length = i;
          break;
        }
      }
    }
    const now = innermostAnchor();
    if (now !== anchor && !inHeading) {
      flush();
      anchor = now;
      heading = "";
    }
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      if (!closing) {
        flush();
        inHeading = true;
        headingBuf = [];
      } else if (inHeading) {
        inHeading = false;
        heading = clean(headingBuf.join(" "));
      }
      continue;
    }
    if (BLOCK.has(tag)) (inHeading ? headingBuf : buf).push(" \n ");
  }
  flush();
  return { title, description, noindex, sections, links, ids };
}

/** Removes UI furniture from mockups and carousels: "9:41", "01 / 06", "●●●", step numbers. */
function denoise(text: string) {
  return text
    .replace(/\b\d{1,2}\s*\/\s*\d{1,2}\b/g, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ")
    .replace(/[●▮✓→←↗|_]+/g, " ")
    .replace(/(^|\s)0\d(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Drops sentences already seen (marquees and carousels repeat their copy). */
function dedupe(text: string, seen: Set<string>) {
  const parts = denoise(text).split(/(?<=[.!?])\s+|\s{2,}|\s·\s/).map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (key.length > 3 && seen.has(key)) continue;
    seen.add(key);
    kept.push(p);
  }
  return kept.join(" ");
}

const cap = (text: string) => (text.length > MAX_SECTION_CHARS ? `${text.slice(0, MAX_SECTION_CHARS).replace(/\s+\S*$/, "")}…` : text);

/* ------------------------------------------------------------------ */
/* Crawl                                                               */
/* ------------------------------------------------------------------ */
const isReadable = (path: string) =>
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !/^\/(admin|api|_next)(\/|$)/.test(path) &&
  !/\.[a-z0-9]{2,5}$/i.test(path) &&
  !(path.replace(/^\//, "") in underDevelopmentRoutes);

function toPath(href: string, base: string): string | null {
  try {
    const u = new URL(href, `${base}/`);
    const own = [base, siteConfig.url.replace(/\/+$/, "")].some((o) => u.origin === new URL(o).origin);
    if (!own) return null;
    const p = u.pathname.replace(/\/+$/, "") || "/";
    return isReadable(p) ? p : null;
  } catch {
    return null;
  }
}

async function get(url: string, accept: string) {
  const res = await fetch(url, {
    headers: { accept, "user-agent": "PicodeJarvisReader/1.0 (+site assistant)" },
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    cache: "no-store",
    redirect: "follow",
  });
  return res;
}

/** First origin that serves our sitemap; that's where the site is reachable from here. */
async function findOrigin(): Promise<{ origin: string; paths: string[] } | null> {
  for (const origin of origins()) {
    try {
      const res = await get(`${origin}/sitemap.xml`, "application/xml,text/xml");
      if (!res.ok) continue;
      const xml = await res.text();
      const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toPath(decode(m[1]!.trim()), origin)).filter((p): p is string => !!p);
      return { origin, paths };
    } catch {
      /* try the next origin */
    }
  }
  return null;
}

const deepLink = (path: string, id: string) => (path === "/" ? `/#${id}` : `${path}#${id}`);

function emptyKnowledge(): SiteKnowledge {
  return {
    pages: [],
    sections: [],
    comingSoon: Object.entries(underDevelopmentRoutes).map(([path, title]) => ({ href: `/${path}`, title })),
    anchors: new Map(),
    builtAt: Date.now(),
  };
}

/** Pages read so far during the current build (used if a reply can't wait for all of them). */
let progress: SiteKnowledge = emptyKnowledge();

/* ------------------------------------------------------------------ */
/* Copy that only exists in the site's client code                      */
/* ------------------------------------------------------------------ */
/*
 * Some copy is only drawn in the browser (e.g. the five offering tabs that
 * aren't open on first load), so it never appears in the HTML. The same text
 * ships in the site's own route bundles (/_next/static/chunks/app/…) as data
 * objects like { title: "…", description: "…" }. Jarvis reads those, keeping
 * only entries whose description reads like real copy. Framework and library
 * chunks are never read.
 */
const MAX_BUNDLE_BYTES = 12 * 1024 * 1024;
/** A double-quoted JS string literal; group 1 is its (still escaped) content. */
const STR = String.raw`"((?:[^"\\]|\\.)*)"`;
const RECORD = new RegExp(
  String.raw`\b(?:title|name|label):\s*${STR}\s*,\s*(?:[A-Za-z_$][\w$]*:\s*(?:${STR}|[\w$.\[\]]+)\s*,\s*){0,3}?(?:description|summary|body|tagline|text):\s*${STR}(?:\s*,\s*(?:points|items|features|bullets):\s*\[([^\]]{0,600})\])?`,
  "g",
);

const unescapeJs = (s: string) =>
  s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, " ")
    .replace(/\\(["'\\/])/g, "$1");

const looksLikeTitle = (t: string) => t.length >= 2 && t.length <= 60 && /^[A-Z0-9]/.test(t) && !/[{}<>;=()]/.test(t) && t.split(/\s+/).length <= 8;
const looksLikeCopy = (t: string) => t.length >= 40 && /^[A-Z]/.test(t) && !/[{}<>;=]|https?:|\$\{/.test(t) && t.split(/\s+/).length >= 7;

type BundleRecord = { title: string; text: string };

function bundleRecords(js: string): BundleRecord[] {
  // Dev bundles wrap modules in eval strings: undo one level of escaping first.
  // One pass, so an escaped backslash is never re-read as the start of another escape.
  const src = js.includes('\\"') ? js.replace(/\\(\\|"|n)/g, (_, c: string) => (c === "n" ? "\n" : c)) : js;
  const out: BundleRecord[] = [];
  for (const m of src.matchAll(RECORD)) {
    // Groups: 1 title, 2 an optional string field in between (ignored), 3 description, 4 bullet list.
    const title = clean(unescapeJs(m[1] ?? ""));
    const desc = clean(unescapeJs(m[3] ?? ""));
    if (!looksLikeTitle(title) || !looksLikeCopy(desc)) continue;
    const points = [...(m[4] ?? "").matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => clean(unescapeJs(x[1]!))).filter((x) => x.length > 1 && x.length < 80 && !/[{}<>;=]/.test(x));
    out.push({ title, text: points.length ? `${desc} Includes: ${points.join(", ")}.` : desc });
  }
  return out;
}

/** Pages that list other pages rather than describe Picode; search weighs them lower. */
const INDEX_PAGES = new Set(["/sitemap"]);

type RawPage = { path: string; html: string };

/** Turns fetched pages into sections. Anchors are resolved against every page, since e.g. the sitemap links to "/#offices". */
function assemble(raw: RawPage[], bundles: { pages: string[]; records: BundleRecord[] }[] = []): SiteKnowledge {
  const k = emptyKnowledge();
  const linkable = new Set(raw.flatMap((r) => linkedIds(r.html)));
  const seen = new Set<string>();
  // Content pages first so their wording wins the de-duplication over index pages.
  const ordered = [...raw].sort((a, b) => Number(INDEX_PAGES.has(a.path)) - Number(INDEX_PAGES.has(b.path)));
  for (const { path, html } of ordered) {
    const page = parsePage(html, linkable);
    if (page.noindex) continue;
    const title = page.title.replace(/\s*[|·–—-]\s*Picode\s*$/i, "") || path;
    k.pages.push({ href: path, title, description: page.description });
    for (const id of page.ids) if (!k.anchors.has(id)) k.anchors.set(id, deepLink(path, id));
    for (const sec of page.sections) {
      const text = dedupe(sec.text, seen);
      const heading = sec.heading || title;
      const href = sec.anchor ? deepLink(path, sec.anchor) : path;
      if (!sec.heading && text.length < 40) continue;
      // Carousels render the same slide more than once: merge into one section.
      const same = k.sections.find((x) => x.href === href && x.heading === heading);
      if (same) {
        same.text = cap(`${same.text} ${text}`.trim());
        continue;
      }
      k.sections.push({ page: path, pageTitle: title, href, heading, text: cap(text), index: INDEX_PAGES.has(path) || undefined });
    }
  }

  // Client-only copy: link each entry to the section of its page where it is shown.
  // Entries defined next to each other in code (one list: offerings, lifecycle
  // phases…) belong together, so the section showing the most of an entry's
  // neighbours wins: "Design" goes with Discover/Build/Test, not with any
  // paragraph that happens to say "design".
  const htmlSections = k.sections.filter((x) => !x.index).map((x) => ({ x, hay: `${x.heading} ${x.text}` }));
  const shown = (title: string) => {
    const re = new RegExp(`(^|[^A-Za-z])${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`);
    return (hay: string) => re.test(hay);
  };
  for (const { pages, records } of bundles) {
    records.forEach((r, i) => {
      const text = dedupe(r.text, seen);
      if (text.length < 30) return; // already known from the HTML
      const isShown = shown(r.title);
      const neighbours = records.slice(Math.max(0, i - 3), i + 4).filter((n) => n !== r).map((n) => shown(n.title));
      const candidates = htmlSections.filter((c) => isShown(c.hay));
      const rank = (c: (typeof candidates)[number]) =>
        neighbours.filter((test) => test(c.hay)).length * 10 + (pages.includes(c.x.page) ? 1 : 0);
      const needle = r.title.toLowerCase();
      const home =
        candidates.sort((a, b) => rank(b) - rank(a))[0]?.x ??
        htmlSections.find((c) => c.hay.toLowerCase().includes(needle))?.x;
      const page = home?.page ?? pages[0] ?? "/";
      const href = home?.href ?? page;
      const same = k.sections.find((x) => x.href === href && x.heading === r.title);
      if (same) same.text = cap(`${same.text} ${text}`);
      else k.sections.push({ page, pageTitle: home?.pageTitle ?? page, href, heading: r.title, text: cap(text) });
    });
  }
  return k;
}

async function crawl(): Promise<SiteKnowledge> {
  progress = emptyKnowledge();
  const found = await findOrigin();
  if (!found) {
    console.warn("[jarvis] Could not reach the site to read it; answering without page knowledge.");
    return progress;
  }
  const { origin } = found;
  const queue = [...new Set(["/", ...found.paths])];
  const visited = new Set<string>();
  const raw: RawPage[] = [];

  const fetchOne = async (path: string) => {
    try {
      const res = await get(`${origin}${path}`, "text/html");
      if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) return;
      const html = await res.text();
      raw.push({ path, html });
      const main = html.slice(Math.max(0, html.search(/<main[\s>]/i)));
      for (const m of main.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
        const p = toPath(decode(m[1]!), origin);
        if (p && !visited.has(p) && !queue.includes(p) && visited.size + queue.length < MAX_PAGES) queue.push(p);
      }
    } catch (error) {
      console.warn(`[jarvis] Skipped ${path}:`, (error as Error).message);
    }
  };

  // A few pages at a time keeps the site responsive while Jarvis reads it.
  while (queue.length && visited.size < MAX_PAGES) {
    const batch = queue.splice(0, 3).filter((p) => !visited.has(p));
    batch.forEach((p) => visited.add(p));
    await Promise.all(batch.map(fetchOne));
    progress = assemble(raw);
  }
  // The site's own route bundles, for copy that is only drawn in the browser.
  const bundlePages = new Map<string, string[]>();
  for (const { path, html } of raw) {
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)) {
      const src = decode(m[1]!);
      if (!src.startsWith("/_next/static/chunks/app/")) continue;
      bundlePages.set(src, [...(bundlePages.get(src) ?? []), path]);
    }
  }
  const bundles: { pages: string[]; records: BundleRecord[] }[] = [];
  for (const [src, pages] of bundlePages) {
    try {
      const res = await get(`${origin}${src}`, "application/javascript,*/*");
      if (!res.ok || Number(res.headers.get("content-length") ?? 0) > MAX_BUNDLE_BYTES) continue;
      const js = await res.text();
      if (js.length > MAX_BUNDLE_BYTES) continue;
      const records = bundleRecords(js);
      if (records.length) bundles.push({ pages, records });
    } catch (error) {
      console.warn(`[jarvis] Skipped bundle ${src}:`, (error as Error).message);
    }
  }

  const k = assemble(raw, bundles);
  k.builtAt = Date.now();
  return k;
}

let cache: SiteKnowledge | null = null;
let building: Promise<SiteKnowledge> | null = null;

function rebuild() {
  building ??= crawl()
    .then((k) => {
      // Keep the previous copy if this read found nothing (e.g. a deploy in progress).
      if (k.sections.length || !cache) cache = k;
      return cache;
    })
    .finally(() => {
      building = null;
    });
  return building;
}

/**
 * The site as Jarvis knows it. Waits at most `waitMs` for a first read; after
 * that it answers with whatever has been read so far while reading continues.
 */
export async function getSiteKnowledge(waitMs = 12_000): Promise<SiteKnowledge> {
  if (cache && Date.now() - cache.builtAt < TTL_MS) return cache;
  const pending = rebuild();
  if (cache) return cache; // stale-while-revalidate
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), waitMs);
  });
  try {
    return (await Promise.race([pending, timeout])) ?? progress;
  } finally {
    clearTimeout(timer);
  }
}
