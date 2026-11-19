"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  Check,
  FileText,
  Inbox,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewKind } from "@/components/sections/hero/vision-ideas";

export type PreviewProps = {
  kind: PreviewKind;
  title: string;
  /** Wireframe skeleton is visible. */
  designed: boolean;
  /** 0 → 1 build progress; blocks fill in order. */
  fill: number;
  shipped: boolean;
};

/** A block that is a grey wireframe until its turn in the build, then becomes real UI. */
function Block({
  on,
  className,
  skeleton,
  children,
}: {
  on: boolean;
  className?: string;
  skeleton?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      <motion.div
        aria-hidden
        className={cn("absolute inset-0 rounded-xl bg-gray-200/80 dark:bg-gray-100", skeleton)}
        animate={{ opacity: on ? 0 : 1 }}
        transition={{ duration: 0.35 }}
      />
      <motion.div
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : 6, filter: on ? "blur(0px)" : "blur(4px)" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function VisionPreview(props: PreviewProps) {
  const { kind, designed } = props;
  return (
    <motion.div
      className="relative h-full overflow-hidden rounded-2xl border border-gray-200/80 bg-surface"
      animate={{ opacity: designed ? 1 : 0.35 }}
      transition={{ duration: 0.4 }}
    >
      {kind === "chat" && <ChatPreview {...props} />}
      {kind === "mobile" && <MobilePreview {...props} />}
      {kind === "dashboard" && <DashboardPreview {...props} />}
      {kind === "automation" && <AutomationPreview {...props} />}

      {!designed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <Sparkles className="size-3.5 animate-pulse text-primary" aria-hidden /> Your solution takes shape here…
          </span>
        </div>
      )}
    </motion.div>
  );
}

const step = (fill: number, i: number, n: number) => fill >= (i + 1) / (n + 1);

/* ------------------------------- Chat ------------------------------- */
function ChatPreview({ title, designed, fill, shipped }: PreviewProps) {
  const n = 5;
  const on = (i: number) => designed && step(fill, i, n);
  return (
    <div className="flex h-full flex-col">
      <Block on={on(0)} className="m-2 h-10" skeleton="rounded-lg">
        <div className="flex h-full items-center gap-2 rounded-lg bg-gradient-primary px-3 text-white">
          <Bot className="size-4" aria-hidden />
          <span className="truncate font-display text-xs font-semibold">{title}</span>
          <span className="ml-auto flex items-center gap-1 text-[0.625rem]">
            <span className="size-1.5 rounded-full bg-white" /> {shipped ? "Live" : "Online"}
          </span>
        </div>
      </Block>
      <div className="flex-1 space-y-2 px-2.5">
        <Block on={on(1)} className="ml-auto h-8 w-[70%]" skeleton="rounded-2xl">
          <p className="flex h-full items-center rounded-2xl rounded-br-md bg-gray-900 px-3 text-[0.6875rem] text-background">
            Where is my order #4821?
          </p>
        </Block>
        <Block on={on(2)} className="h-[3.25rem] w-[85%]" skeleton="rounded-2xl">
          <div className="h-full rounded-2xl rounded-bl-md border border-gray-100 bg-gray-50 px-3 py-2 text-[0.6875rem] leading-snug text-gray-700">
            It&apos;s out for delivery and arrives today by 6&nbsp;pm.
            <span className="mt-1 flex gap-1">
              <span className="rounded bg-primary/15 px-1.5 text-[0.5625rem] font-medium text-primary-strong">Orders API</span>
              <span className="rounded bg-secondary/15 px-1.5 text-[0.5625rem] font-medium text-secondary-strong">Tracking</span>
            </span>
          </div>
        </Block>
        <Block on={on(3)} className="ml-auto h-8 w-[55%]" skeleton="rounded-2xl">
          <p className="flex h-full items-center rounded-2xl rounded-br-md bg-gray-900 px-3 text-[0.6875rem] text-background">
            Perfect, thanks!
          </p>
        </Block>
        {on(3) && (
          <div className="flex w-12 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-2">
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="size-1.5 rounded-full bg-gray-400"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
              />
            ))}
          </div>
        )}
      </div>
      <Block on={on(4)} className="m-2 h-9" skeleton="rounded-full">
        <div className="flex h-full items-center rounded-full border border-gray-200 bg-surface pl-3 pr-1 text-[0.6875rem] text-gray-400">
          Ask anything…
          <span className="ml-auto inline-flex size-7 items-center justify-center rounded-full bg-gradient-primary text-white">
            <Send className="size-3" aria-hidden />
          </span>
        </div>
      </Block>
    </div>
  );
}

/* ------------------------------ Mobile ------------------------------ */
function MobilePreview({ title, designed, fill }: PreviewProps) {
  const n = 5;
  const on = (i: number) => designed && step(fill, i, n);
  const bars = [38, 62, 45, 80, 55, 92, 70];
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-gray-50 to-surface p-2">
      <div className="relative flex h-full max-h-[17.5rem] w-[9.5rem] flex-col gap-2 rounded-[1.6rem] border-[5px] border-gray-900 bg-surface p-2 shadow-float">
        <span aria-hidden className="absolute left-1/2 top-1 h-1 w-8 -translate-x-1/2 rounded-full bg-gray-900" />
        <Block on={on(0)} className="mt-2 h-5" skeleton="rounded-md">
          <p className="flex items-center justify-between text-[0.625rem]">
            <span className="font-display font-semibold text-gray-900">{title}</span>
            <span className="size-4 rounded-full bg-gradient-primary" />
          </p>
        </Block>
        <Block on={on(1)} className="h-[4.25rem]" skeleton="rounded-xl">
          <div className="h-full rounded-xl bg-gradient-primary p-2 text-white">
            <p className="text-[0.5625rem] opacity-80">Total balance</p>
            <p className="font-display text-base font-bold leading-tight">$12,480</p>
            <p className="mt-0.5 text-[0.5625rem] opacity-90">+4.2% this week</p>
          </div>
        </Block>
        <Block on={on(2)} className="h-16" skeleton="rounded-xl">
          <div className="flex h-full items-end gap-1 rounded-xl border border-gray-100 p-1.5">
            {bars.map((h, i) => (
              <motion.span
                key={i}
                className={cn("flex-1 rounded-sm", i === 5 ? "bg-primary" : "bg-secondary/40")}
                initial={{ height: 0 }}
                animate={{ height: on(2) ? `${h}%` : 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              />
            ))}
          </div>
        </Block>
        <Block on={on(3)} className="h-9" skeleton="rounded-xl">
          <div className="grid h-full grid-cols-3 gap-1">
            {[ArrowUpRight, ArrowDownLeft, Plus].map((I, i) => (
              <span key={i} className="flex items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <I className="size-3.5" aria-hidden />
              </span>
            ))}
          </div>
        </Block>
        <Block on={on(4)} className="h-8" skeleton="rounded-lg">
          <div className="flex h-full items-center gap-1.5 rounded-lg border border-gray-100 px-1.5 text-[0.5625rem]">
            <ShieldCheck className="size-3.5 text-success" aria-hidden />
            <span className="text-gray-700">Face ID secured</span>
          </div>
        </Block>
      </div>
    </div>
  );
}

/* ----------------------------- Dashboard ---------------------------- */
function DashboardPreview({ title, designed, fill }: PreviewProps) {
  const n = 5;
  const on = (i: number) => designed && step(fill, i, n);
  const kpis = [
    { k: "MRR", v: "$84.2k", d: "+12%" },
    { k: "Churn", v: "1.8%", d: "−0.4" },
    { k: "CAC", v: "$112", d: "−9%" },
  ];
  return (
    <div className="flex h-full flex-col gap-2 p-2.5">
      <Block on={on(0)} className="h-6" skeleton="rounded-md">
        <p className="flex items-center justify-between">
          <span className="font-display text-xs font-semibold text-gray-900">{title}</span>
          <span className="rounded-full bg-success/15 px-1.5 text-[0.5625rem] font-medium text-success">● Live</span>
        </p>
      </Block>
      <div className="grid grid-cols-3 gap-1.5">
        {kpis.map((x, i) => (
          <Block key={x.k} on={on(1)} className="h-12" skeleton="rounded-lg">
            <div className="h-full rounded-lg border border-gray-100 p-1.5" style={{ transitionDelay: `${i * 60}ms` }}>
              <p className="text-[0.5625rem] text-gray-500">{x.k}</p>
              <p className="font-display text-xs font-bold text-gray-900">{x.v}</p>
              <p className="text-[0.5rem] font-medium text-success">{x.d}</p>
            </div>
          </Block>
        ))}
      </div>
      <Block on={on(2)} className="flex-1" skeleton="rounded-lg">
        <div className="relative h-full rounded-lg border border-gray-100 p-1.5">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="size-full">
            <defs>
              <linearGradient id="vp-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="rgb(45 212 191)" stopOpacity="0.35" />
                <stop offset="1" stopColor="rgb(45 212 191)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0 62 C20 58 30 48 50 50 S80 30 100 34 S140 18 160 22 S190 8 200 6 L200 80 L0 80Z"
              fill="url(#vp-area)"
              initial={{ opacity: 0 }}
              animate={{ opacity: on(2) ? 1 : 0 }}
              transition={{ delay: 0.5 }}
            />
            <motion.path
              d="M0 62 C20 58 30 48 50 50 S80 30 100 34 S140 18 160 22 S190 8 200 6"
              fill="none"
              stroke="rgb(45 212 191)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: on(2) ? 1 : 0 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
            <motion.path
              d="M150 24 S190 4 200 -2"
              fill="none"
              stroke="rgb(56 189 248)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              initial={{ opacity: 0 }}
              animate={{ opacity: on(3) ? 1 : 0 }}
            />
          </svg>
          {on(3) && (
            <span className="absolute right-2 top-1.5 rounded bg-secondary/15 px-1 text-[0.5rem] font-medium text-secondary-strong">
              Forecast
            </span>
          )}
        </div>
      </Block>
      <Block on={on(4)} className="h-10" skeleton="rounded-lg">
        <div className="grid h-full grid-rows-2 rounded-lg border border-gray-100 px-1.5 text-[0.5625rem]">
          {[
            ["Stripe", "$52.1k"],
            ["CRM", "$32.1k"],
          ].map(([a, b]) => (
            <p key={a} className="flex items-center justify-between border-b border-gray-100 last:border-0">
              <span className="text-gray-500">{a}</span>
              <span className="font-medium text-gray-900">{b}</span>
            </p>
          ))}
        </div>
      </Block>
    </div>
  );
}

/* ---------------------------- Automation ---------------------------- */
function AutomationPreview({ title, designed, fill, shipped }: PreviewProps) {
  const nodes = [
    { icon: Inbox, label: "New invoice email" },
    { icon: FileText, label: "AI extracts fields" },
    { icon: ShieldCheck, label: "Validate vs ERP" },
    { icon: Check, label: "Auto-approve" },
    { icon: Workflow, label: "Synced to ledger" },
  ];
  const n = nodes.length;
  const on = (i: number) => designed && step(fill, i, n);
  return (
    <div className="flex h-full flex-col p-2.5">
      <p className="mb-1.5 flex items-center justify-between">
        <span className="font-display text-xs font-semibold text-gray-900">{title}</span>
        <span className="text-[0.5625rem] text-gray-400">{shipped ? "Running · 0 errors" : "Draft"}</span>
      </p>
      <div className="flex flex-1 flex-col justify-between">
        {nodes.map(({ icon: I, label }, i) => (
          <div key={label} className="relative flex items-center gap-2">
            {i < n - 1 && (
              <span aria-hidden className="absolute left-[0.9rem] top-7 h-[calc(100%-0.5rem)] w-px bg-gray-200">
                <motion.span
                  className="absolute inset-x-0 top-0 bg-gradient-primary"
                  initial={{ height: 0 }}
                  animate={{ height: on(i + 1) ? "100%" : 0 }}
                  transition={{ duration: 0.4 }}
                />
              </span>
            )}
            <Block on={on(i)} className="size-7 shrink-0" skeleton="rounded-lg">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-glow">
                <I className="size-3.5" aria-hidden />
              </span>
            </Block>
            <Block on={on(i)} className="h-7 flex-1" skeleton="rounded-lg">
              <div className="flex h-full items-center justify-between rounded-lg border border-gray-100 px-2 text-[0.625rem]">
                <span className="text-gray-700">{label}</span>
                {shipped && <Check className="size-3 text-success" aria-hidden />}
              </div>
            </Block>
          </div>
        ))}
      </div>
    </div>
  );
}
