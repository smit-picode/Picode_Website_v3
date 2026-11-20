"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  ChevronDown,
  Cloud,
  Database,
  LayoutTemplate,
  Server,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TechItem = { name: string; use: string; hex: string; path: string | null };
export type TechCategory = {
  id: string;
  label: string;
  /** Architecture layer this category belongs to, e.g. "Experience". */
  layer: string;
  icon: "layout" | "smartphone" | "server" | "brain" | "cloud" | "database";
  blurb: string;
  items: TechItem[];
};

const categoryIcons: Record<TechCategory["icon"], LucideIcon> = {
  layout: LayoutTemplate,
  smartphone: Smartphone,
  server: Server,
  brain: BrainCircuit,
  cloud: Cloud,
  database: Database,
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The stack as a product architecture: each category is a layer, top (what users
 * touch) to bottom (where it runs). A request pulse travels down the spine; click a
 * layer to open it and see every tool and what we use it for.
 */
export function TechStackExplorer({ categories }: { categories: TechCategory[] }) {
  const [open, setOpen] = useState<string | null>(categories[0]?.id ?? null);
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Spine: users → … → cloud */}
      <div aria-hidden className="absolute bottom-8 left-[1.375rem] top-8 w-px bg-gray-200 sm:left-[1.875rem]">
        {!reduce && (
          <motion.span
            className="absolute left-1/2 h-24 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-primary to-transparent"
            animate={{ top: ["-10%", "100%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
          />
        )}
      </div>

      {/* Entry point */}
      <div className="relative mb-3 flex items-center gap-4 sm:gap-6">
        <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-surface text-gray-500 shadow-soft sm:size-[3.75rem]">
          <Users className="size-4 sm:size-5" aria-hidden />
        </span>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Your users</p>
      </div>

      <ol className="relative space-y-3">
        {categories.map((c, i) => (
          <Layer
            key={c.id}
            category={c}
            index={i}
            open={open === c.id}
            onToggle={() => setOpen((cur) => (cur === c.id ? null : c.id))}
          />
        ))}
      </ol>
    </div>
  );
}

function Layer({
  category,
  index,
  open,
  onToggle,
}: {
  category: TechCategory;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = categoryIcons[category.icon];
  const panelId = `tech-layer-${category.id}`;

  return (
    <motion.li
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: EASE }}
      className="relative flex gap-4 sm:gap-6"
    >
      {/* Spine node */}
      <span className="relative z-10 mt-3 flex size-11 shrink-0 items-center justify-center sm:mt-3.5 sm:size-[3.75rem]">
        <motion.span
          animate={{ scale: open ? 1 : 0.82 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={cn(
            "flex size-full items-center justify-center rounded-2xl border transition-colors duration-300",
            open
              ? "border-transparent bg-gradient-primary text-white shadow-glow"
              : "border-gray-200 bg-surface text-gray-500 shadow-soft",
          )}
        >
          <Icon className="size-[18px] sm:size-6" strokeWidth={1.75} aria-hidden />
        </motion.span>
        {open && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-2xl border-2 border-primary"
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </span>

      {/* Layer card */}
      <div
        className={cn(
          "min-w-0 flex-1 overflow-hidden rounded-3xl border bg-surface transition-[border-color,box-shadow] duration-300",
          open ? "border-primary/25 shadow-float" : "border-gray-100 shadow-soft hover:border-gray-200 hover:shadow-float",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex w-full items-center gap-4 px-4 py-4 text-left max-[359px]:gap-3 max-[359px]:px-3 sm:px-6 sm:py-5"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-primary-strong max-[359px]:tracking-[0.08em]">
              {category.layer} layer
            </span>
            <span className="mt-0.5 block font-display text-lg font-semibold text-gray-900 sm:text-xl">
              {category.label}
            </span>
          </span>

          {/* Logo strip — fans out on hover, hidden when open */}
          <AnimatePresence initial={false}>
            {!open && (
              <motion.span
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
                className="hidden items-center sm:flex"
                aria-hidden
              >
                {category.items.map((t, i) => (
                  <span
                    key={t.name}
                    className="-ml-2 inline-flex size-9 items-center justify-center rounded-xl border border-gray-100 bg-surface shadow-soft ring-2 ring-surface transition-[margin,transform] duration-300 first:ml-0 group-hover:ml-1 group-hover:-translate-y-0.5"
                    style={{ transitionDelay: `${i * 25}ms`, zIndex: category.items.length - i }}
                    title={t.name}
                  >
                    <BrandIcon tech={t} className="size-[18px]" />
                  </span>
                ))}
              </motion.span>
            )}
          </AnimatePresence>

          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 font-display text-xs font-semibold tabular-nums text-gray-500 sm:hidden">
            {category.items.length}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
              open ? "bg-primary/10 text-primary-strong" : "bg-gray-100 text-gray-500 group-hover:text-gray-900",
            )}
          >
            <ChevronDown className="size-4" aria-hidden />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <div className="border-t border-gray-100 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
                <p className="max-w-2xl text-body-sm text-gray-500">{category.blurb}</p>
                <ul className="mt-5 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-4">
                  {category.items.map((t, i) => (
                    <motion.li
                      key={t.name}
                      initial={{ opacity: 0, y: 14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.12 + i * 0.04, duration: 0.4, ease: EASE }}
                    >
                      <TechTile tech={t} />
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

/** Very dark brand colours (Next.js, Vercel, Apple…) fall back to the theme text colour. */
function isTooDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 60;
}

export function BrandIcon({ tech, className }: { tech: TechItem; className?: string }) {
  const color = isTooDark(tech.hex) ? "currentColor" : tech.hex;
  if (!tech.path) {
    return (
      <span
        className={cn("inline-flex items-center justify-center font-display text-xs font-bold", className)}
        style={{ color }}
      >
        {tech.name.charAt(0)}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={tech.name} className={cn("text-gray-900", className)} fill={color}>
      <path d={tech.path} />
    </svg>
  );
}

function TechTile({ tech }: { tech: TechItem }) {
  return (
    <div className="group relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/60 p-3 transition-[transform,box-shadow,border-color,background-color] duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-soft">
      <span
        aria-hidden
        className="absolute -right-6 -top-6 size-16 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: tech.hex }}
      />
      <span
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
        style={{ backgroundColor: `${tech.hex}1A` }}
      >
        <BrandIcon tech={tech} className="size-5" />
      </span>
      <span className="relative min-w-0">
        <span className="block truncate font-display text-sm font-semibold text-gray-900">{tech.name}</span>
        <span className="block truncate text-[0.75rem] text-gray-500">{tech.use}</span>
      </span>
    </div>
  );
}
