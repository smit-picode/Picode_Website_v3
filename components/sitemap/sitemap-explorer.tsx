"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Blocks,
  Handshake,
  Route,
  Bot,
  Briefcase,
  Building2,
  Cpu,
  FileText,
  FolderKanban,
  Home,
  Layers,
  LayoutGrid,
  Mail,
  MapPin,
  Palette,
  Scale,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  Workflow,
  BarChart3,
  CircleHelp,
  Factory,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingSpheres } from "./floating-spheres";

const CONTACT_HREF = "/contact";

/**
 * Same reason for every home-section link ("/#offerings", "/#work"…): those do a
 * full load so the browser lands on the section once the page is laid out.
 * Normal page links keep fast client-side navigation.
 */
const isSectionLink = (href: string) => href.includes("#");
function goToSection(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (!isSectionLink(href) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // keep new-tab clicks
  e.preventDefault();
  window.location.assign(href);
}

export type SitemapItem = { label: string; href: string; hint: string; soon: boolean };
export type SitemapGroup = { title: string; blurb: string; items: SitemapItem[] };

/* Icons live on the client (components can't be passed from the server page). */
const groupIcons: Record<string, LucideIcon> = { Home, Company: Building2, Services: Layers, Legal: Scale };
const itemIcons: Record<string, LucideIcon> = {
  "/": Home,
  "/#offerings": LayoutGrid,
  "/#ai-native": Sparkles,
  "/#tech": Cpu,
  "/#work": FolderKanban,
  "/contact#offices": MapPin,
  "/about": Building2,
  "/careers": Briefcase,
  "/contact": Mail,
  "/services": Layers,
  "/services#agentic-modernization": Bot,
  "/services#web-mobile": Smartphone,
  "/services#workflow-automation": Workflow,
  "/services#data-driven-apps": BarChart3,
  "/services#industries": Factory,
  "/services#faq": CircleHelp,
  "/services#included": Palette,
  "/services#engagement": Handshake,
  "/services#accelerators": Blocks,
  "/services#process": Route,
  "/privacy": Shield,
  "/terms": FileText,
};
const iconFor = (href: string) => itemIcons[href] ?? ArrowUpRight;

/* ------------------------------------------------------------------ */
/* Map geometry: Picode core → section hubs → page nodes               */
/* ------------------------------------------------------------------ */
const W = 1100;
const H = 600;
const C = { x: W / 2, y: H / 2 };
const HUB_ANGLE: Record<string, number> = { Home: 225, Company: 310, Services: 50, Legal: 135 };
const LEAF_GAP = 40; // vertical spacing between page nodes
const LEAF_OFFSET = 170; // horizontal distance from hub to its column of pages
const rad = (d: number) => (d * Math.PI) / 180;

type Node = { x: number; y: number; angle: number };
function layout(groups: SitemapGroup[]) {
  const hubs: Record<string, Node> = {};
  const leaves: Record<string, Node> = {};
  groups.forEach((g, gi) => {
    const a = HUB_ANGLE[g.title] ?? (360 / groups.length) * gi;
    const hub = { x: C.x + Math.cos(rad(a)) * 205, y: C.y + Math.sin(rad(a)) * 160, angle: a };
    hubs[g.title] = hub;
    // Pages sit in a tidy column on the outer side of their hub, so labels
    // never collide however many pages a section has.
    const side = Math.cos(rad(a)) >= 0 ? 1 : -1;
    const n = g.items.length;
    g.items.forEach((it, i) => {
      leaves[`${g.title}:${it.href}`] = {
        x: hub.x + side * LEAF_OFFSET,
        y: hub.y + (i - (n - 1) / 2) * LEAF_GAP,
        angle: side > 0 ? 0 : 180,
      };
    });
  });
  return { hubs, leaves };
}
const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // gentle bend toward the centre line so edges read as organic branches
  return `M${a.x},${a.y} Q${mx + (C.y - my) * 0.12},${my + (mx - C.x) * 0.12} ${b.x},${b.y}`;
};
/** Smooth horizontal S-curve from a hub to one of its pages. */
const branch = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = (b.x - a.x) / 2;
  return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
};

function matches(item: SitemapItem, group: string, q: string) {
  if (!q) return true;
  const hay = `${item.label} ${item.hint} ${group} ${item.href}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export function SitemapExplorer({ groups }: { groups: SitemapGroup[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null); // hovered page href
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { hubs, leaves } = useMemo(() => layout(groups), [groups]);
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => matches(it, g.title, query)) }))
    .filter((g) => g.items.length > 0);
  const hitCount = visible.reduce((n, g) => n + g.items.length, 0);

  // "/" focuses search, Escape clears it (ignored while typing in other fields).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && t === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isLit = (group: string, item: SitemapItem) =>
    matches(item, group, query) && (!active || active === item.href) && (!activeGroup || activeGroup === group || active === item.href);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <div className="relative">
        <FloatingSpheres />
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-primary-strong"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden /> Sitemap
        </motion.p>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-3xl text-display-3"
        >
          Explore every corner of <span className="text-gradient-primary">Picode</span>
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.7 }}
          className="mt-5 max-w-xl text-body-md text-gray-500"
        >
          Hover the map to trace a path, click any node to jump straight there, or search for what you need.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-9 flex flex-col gap-4 lg:flex-row lg:items-center"
        >
          <label className="group relative flex w-full max-w-xl items-center">
            <span className="sr-only">Search pages</span>
            <Search className="pointer-events-none absolute left-5 size-5 text-gray-400 transition-colors group-focus-within:text-primary" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, services, sections…"
              className="h-14 w-full rounded-full border border-gray-200 bg-surface pl-14 pr-24 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-primary/50 focus:shadow-glow"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-4 inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-5 rounded-md border border-gray-200 bg-surface-muted px-2 py-0.5 font-mono text-xs text-gray-500">/</kbd>
            )}
          </label>
        </motion.div>
        <p className="sr-only" aria-live="polite">
          {query ? `${hitCount} pages match ${query}` : ""}
        </p>
      </div>

      {/* ---------------- Interactive map (md+) ---------------- */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-14 hidden overflow-hidden rounded-[2rem] border border-gray-200/70 bg-surface-muted/60 md:block"
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(rgb(var(--color-primary)/0.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        <div aria-hidden className="absolute left-1/2 top-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-primary opacity-[0.12]" />

        <svg viewBox={`0 0 ${W} ${H}`} className="relative block w-full" role="group" aria-label="Interactive site map">
          <defs>
            {/* userSpaceOnUse: with the default bounding-box units a perfectly
                horizontal branch (zero height) can't paint the gradient and vanishes. */}
            <linearGradient id="sm-edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
              <stop offset="0" stopColor="rgb(var(--color-primary))" />
              <stop offset="1" stopColor="rgb(var(--color-secondary))" />
            </linearGradient>
            <radialGradient id="sm-core">
              <stop offset="0" stopColor="rgb(var(--color-secondary))" />
              <stop offset="1" stopColor="rgb(var(--color-primary))" />
            </radialGradient>
          </defs>

          {/* core → hubs */}
          {groups.map((g, gi) => {
            const hub = hubs[g.title]!;
            const d = curve(C, hub);
            const lit = !activeGroup || activeGroup === g.title;
            return (
              <g key={`e-${g.title}`}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke="url(#sm-edge)"
                  strokeWidth={2}
                  initial={reduce ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.2 + gi * 0.12 }}
                  style={{ opacity: lit ? 0.9 : 0.15, transition: "opacity .3s" }}
                />
                {!reduce && (
                  <circle r={3} fill="rgb(var(--color-secondary))">
                    <animateMotion dur={`${2.6 + gi * 0.4}s`} repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* hubs → pages */}
          {groups.map((g, gi) =>
            g.items.map((it, i) => {
              const hub = hubs[g.title]!;
              const leaf = leaves[`${g.title}:${it.href}`]!;
              const lit = isLit(g.title, it);
              return (
                <motion.path
                  key={`l-${g.title}-${it.href}`}
                  d={branch(hub, leaf)}
                  fill="none"
                  stroke={lit && (active === it.href || activeGroup === g.title) ? "url(#sm-edge)" : "rgb(var(--color-primary) / 0.45)"}
                  strokeWidth={active === it.href ? 2.5 : 1.25}
                  strokeDasharray={it.soon ? "4 5" : undefined}
                  initial={reduce ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.7 + gi * 0.12 + i * 0.05 }}
                  style={{ opacity: lit ? 1 : 0.12, transition: "opacity .3s, stroke-width .2s" }}
                />
              );
            }),
          )}

          {/* page nodes */}
          {groups.map((g, gi) =>
            g.items.map((it, i) => {
              const leaf = leaves[`${g.title}:${it.href}`]!;
              const lit = isLit(g.title, it);
              const right = Math.cos(rad(leaf.angle)) >= 0;
              const on = active === it.href;
              return (
                <motion.g
                  key={`n-${g.title}-${it.href}`}
                  role="link"
                  tabIndex={0}
                  aria-label={`${it.label}${it.soon ? " (coming soon)" : ""}`}
                  className="cursor-pointer outline-none [&:focus-visible_circle.ring]:opacity-100"
                  onMouseEnter={() => setActive(it.href)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(it.href)}
                  onBlur={() => setActive(null)}
                  onClick={() => (isSectionLink(it.href) ? window.location.assign(it.href) : router.push(it.href))}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), isSectionLink(it.href) ? window.location.assign(it.href) : router.push(it.href))}
                  initial={reduce ? false : { opacity: 0, scale: 0.4 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 + gi * 0.12 + i * 0.05, type: "spring", stiffness: 260, damping: 18 }}
                  style={{ transformOrigin: `${leaf.x}px ${leaf.y}px`, transformBox: "view-box" }}
                >
                  <g style={{ opacity: lit ? 1 : 0.3, transition: "opacity .3s" }}>
                    <circle className="ring" cx={leaf.x} cy={leaf.y} r={15} fill="none" stroke="rgb(var(--color-primary))" strokeOpacity={on ? 0.6 : 0} strokeWidth={1.5} style={{ transition: "stroke-opacity .2s" }} />
                    {on && !reduce && (
                      <circle cx={leaf.x} cy={leaf.y} r={8} fill="none" stroke="rgb(var(--color-primary))" strokeWidth={1.5}>
                        <animate attributeName="r" values="8;22" dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values="0.7;0" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={leaf.x}
                      cy={leaf.y}
                      r={on ? 8 : 6}
                      fill={it.soon ? "rgb(var(--color-surface))" : "rgb(var(--color-primary))"}
                      stroke={it.soon ? "rgb(251 191 36)" : "rgb(var(--color-primary))"}
                      strokeWidth={2}
                      style={{ transition: "r .2s" }}
                    />
                    <text
                      x={leaf.x + (right ? 16 : -16)}
                      y={leaf.y + 4}
                      textAnchor={right ? "start" : "end"}
                      className={cn("select-none font-sans text-[13px] transition-colors", on ? "fill-gray-900 font-semibold" : "fill-gray-600")}
                    >
                      {it.label}
                    </text>
                  </g>
                </motion.g>
              );
            }),
          )}

          {/* hubs */}
          {groups.map((g, gi) => {
            const hub = hubs[g.title]!;
            const lit = !activeGroup || activeGroup === g.title;
            return (
              <motion.g
                key={`h-${g.title}`}
                className="cursor-default"
                onMouseEnter={() => setActiveGroup(g.title)}
                onMouseLeave={() => setActiveGroup(null)}
                initial={reduce ? false : { opacity: 0, scale: 0.3 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + gi * 0.12, type: "spring", stiffness: 220, damping: 16 }}
                style={{ transformOrigin: `${hub.x}px ${hub.y}px`, transformBox: "view-box", opacity: lit ? 1 : 0.35 }}
              >
                <rect x={hub.x - 62} y={hub.y - 19} width={124} height={38} rx={19} fill="rgb(var(--color-surface))" stroke="url(#sm-edge)" strokeWidth={1.5} />
                <text x={hub.x} y={hub.y + 5} textAnchor="middle" className="select-none fill-gray-900 font-display text-[14px] font-semibold">
                  {g.title}
                </text>
              </motion.g>
            );
          })}

          {/* core */}
          <g aria-hidden>
            {!reduce && (
              <circle cx={C.x} cy={C.y} r={46} fill="none" stroke="rgb(var(--color-primary))" strokeWidth={1}>
                <animate attributeName="r" values="46;80" dur="2.8s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.5;0" dur="2.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={C.x} cy={C.y} r={46} fill="url(#sm-core)" />
            <circle cx={C.x} cy={C.y} r={54} fill="none" stroke="rgb(var(--color-primary) / 0.35)" strokeDasharray="3 6">
              {!reduce && <animateTransform attributeName="transform" type="rotate" from={`0 ${C.x} ${C.y}`} to={`360 ${C.x} ${C.y}`} dur="24s" repeatCount="indefinite" />}
            </circle>
            <text x={C.x} y={C.y + 6} textAnchor="middle" className="select-none fill-white font-display text-[17px] font-bold tracking-tight">
              picode
            </text>
          </g>
        </svg>

        {/* legend + hover readout */}
        <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-gray-200/60 px-6 py-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-5">
            <span className="hidden items-center gap-2 lg:flex">Hover a section to focus it</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={active ?? "idle"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="font-mono text-gray-600"
            >
              {active ? `→ ${active}` : "Click a node to open the page"}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ---------------- Directory cards ---------------- */}
      {/* Two balanced columns (masonry): each card keeps its natural height and
          the last card in each column stretches, so both columns end level. */}
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
        {balance(visible).map((column, ci) => (
        <div key={ci} className="flex flex-col gap-6">
        <AnimatePresence mode="popLayout">
          {column.map((g, idx) => {
            const GIcon = groupIcons[g.title] ?? Layers;
            const gi = ci + idx * 2;
            const last = idx === column.length - 1;
            return (
              <motion.nav
                layout
                key={g.title}
                aria-label={g.title}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: gi * 0.08, ease: [0.22, 1, 0.36, 1] }}
                onMouseMove={spotlight}
                onMouseEnter={() => setActiveGroup(g.title)}
                onMouseLeave={() => setActiveGroup(null)}
                className={cn(
                  "group/card relative overflow-hidden rounded-3xl border border-gray-200/70 bg-surface p-6 transition-[border-color,box-shadow] duration-500 hover:border-primary/40 hover:shadow-float",
                  last && "md:flex-1",
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                  style={{ background: "radial-gradient(360px circle at var(--mx,50%) var(--my,0%), rgb(var(--color-primary)/0.12), transparent 60%)" }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary-strong ring-1 ring-inset ring-primary/25 transition-transform duration-500 group-hover/card:-rotate-6 group-hover/card:scale-110">
                      <GIcon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-semibold tracking-tight">{g.title}</h2>
                      <p className="text-xs text-gray-500">{g.blurb}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[0.6875rem] text-gray-500">{g.items.length}</span>
                </div>

                <ul className="relative mt-5 space-y-1">
                  {g.items.map((it) => {
                    const Icon = iconFor(it.href);
                    return (
                      <motion.li layout key={it.href}>
                        <Link
                          href={it.href}
                          onClick={(e) => goToSection(e, it.href)}
                          onMouseEnter={() => setActive(it.href)}
                          onMouseLeave={() => setActive(null)}
                          onFocus={() => setActive(it.href)}
                          onBlur={() => setActive(null)}
                          className={cn(
                            "group/item flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 hover:translate-x-1 hover:bg-primary/[0.07]",
                            active === it.href && "translate-x-1 bg-primary/[0.07]",
                          )}
                        >
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-gray-500 ring-1 ring-inset ring-gray-200/70 transition-colors group-hover/item:bg-primary group-hover/item:text-white group-hover/item:ring-transparent">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <Highlight text={it.label} query={query} />
                            </span>
                            <span className="block truncate text-xs text-gray-500">{it.hint}</span>
                          </span>
                          {it.soon ? (
                            <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">Soon</span>
                          ) : (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden /> Live
                            </span>
                          )}
                          <ArrowUpRight className="size-4 shrink-0 text-gray-300 transition-all group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 group-hover/item:text-primary" aria-hidden />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.nav>
            );
          })}
        </AnimatePresence>
        </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="mt-14 rounded-3xl border border-dashed border-gray-300 p-12 text-center">
          <p className="font-display text-lg font-semibold">No pages match &ldquo;{query}&rdquo;</p>
          <p className="mt-2 text-sm text-gray-500">
            Try another word, or{" "}
            <a href={CONTACT_HREF} className="font-medium text-primary-strong hover:underline">ask our team</a>.
          </p>
        </div>
      )}

      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-200/70 bg-gradient-primary-soft p-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-display font-semibold">Can&apos;t find what you&apos;re looking for?</p>
          <p className="mt-1 text-sm text-gray-500">Tell us what you need and we&apos;ll point you the right way.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={CONTACT_HREF}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Talk to us <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </>
  );
}

/**
 * Split groups into two columns whose heights (links + header) are as close
 * as possible, keeping the original order inside each column. With 4 groups
 * this is a tiny brute force; Home + Company | Services + Legal today.
 */
function balance(groups: SitemapGroup[]): SitemapGroup[][] {
  if (groups.length < 2) return [groups];
  const weight = (g: SitemapGroup) => g.items.length + 2;
  const total = groups.reduce((n, g) => n + weight(g), 0);
  let best = 1;
  let bestDiff = Infinity;
  // bit i set → group i goes to the right column; group 0 always starts left
  for (let mask = 0; mask < 1 << groups.length; mask++) {
    if (mask & 1) continue;
    const right = groups.reduce((n, g, i) => (mask & (1 << i) ? n + weight(g) : n), 0);
    const diff = Math.abs(total - 2 * right);
    if (right > 0 && diff < bestDiff) {
      best = mask;
      bestDiff = diff;
    }
  }
  return [groups.filter((_, i) => !(best & (1 << i))), groups.filter((_, i) => best & (1 << i))];
}

function spotlight(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return (
    <>
      {text.split(re).map((part, i) =>
        words.includes(part.toLowerCase()) ? (
          <mark key={i} className="rounded bg-primary/25 px-0.5 text-inherit">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
