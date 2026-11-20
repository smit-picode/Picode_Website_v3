"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Check, FileText, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One looping illustration per service, drawn on a brand stage like the case studies.
 * Kept light on purpose: HTML + CSS + a little framer-motion, no images.
 */

/** Stage colour per service: all within the brand's teal → sky range. */
export const SERVICE_STAGE = [
  "radial-gradient(120% 90% at 85% 0%, #34d3bd, #0d9488 45%, #0a3a3f)",
  "radial-gradient(120% 90% at 85% 0%, #5cc8f5, #0e8fb3 45%, #0b2f48)",
  "radial-gradient(120% 90% at 85% 0%, #2bb3a3, #0b4f5c 50%, #071a2a)",
  "radial-gradient(120% 90% at 85% 0%, #7dd3fc, #0ea5e9 35%, #0d9488 70%, #0a3a3f)",
];

const card = "rounded-xl bg-white text-slate-800 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.55),0_8px_16px_-10px_rgba(0,0,0,0.25)]";

export function ServiceScene({ id }: { id: string }) {
  switch (id) {
    case "agentic-modernization":
      return <ModernizeScene />;
    case "web-mobile":
      return <WebMobileScene />;
    case "workflow-automation":
      return <WorkflowScene />;
    default:
      return <DataScene />;
  }
}

/** A legacy monolith breaks into modern services, with an AI agent working across them. */
function ModernizeScene() {
  const reduce = useReducedMotion();
  const tiles = ["Orders API", "Billing", "Customers", "Approvals", "Reports", "Agent hub"];
  return (
    // Phones: stacked (legacy card → connector → tiles) so the tile labels have room; sm+: side by side.
    <div className="relative grid w-full max-w-[30rem] grid-cols-1 items-center gap-3 sm:grid-cols-[0.8fr_auto_1.2fr]">
      <div className={cn(card, "bg-slate-100 p-3 font-mono text-[0.625rem] text-slate-500")}>
        <p className="flex justify-between">
          <span>legacy.exe</span>
          <span>2009</span>
        </p>
        {[85, 60, 75, 50, 68].map((w, i) => (
          <span key={i} className="mt-1.5 block h-1.5 rounded-sm bg-slate-300" style={{ width: `${w}%` }} />
        ))}
        <span className="mt-2 inline-block rounded bg-emerald-500 px-1.5 py-0.5 text-[0.5rem] font-semibold text-white">kept & wrapped</span>
      </div>
      <div className="relative mx-auto h-5 w-px bg-white/50 sm:mx-0 sm:h-px sm:w-10">
        {!reduce &&
          [0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute -top-1 hidden size-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] sm:block"
              animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8 }}
            />
          ))}
      </div>
      <div className="relative grid grid-cols-2 gap-2">
        {tiles.map((t, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={cn(card, "flex items-center gap-1.5 px-2.5 py-2 text-[0.6875rem] font-semibold", i === 5 && "bg-teal-50 text-teal-700")}
          >
            {i === 5 ? <Bot className="size-3.5" aria-hidden /> : <span className="size-1.5 rounded-full bg-teal-500" />}
            {t}
          </motion.div>
        ))}
        {!reduce && (
          <motion.span
            className="absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-white text-teal-600 shadow-lg"
            animate={{ y: [0, 70, 30, 0], x: [0, -90, -40, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="size-4" aria-hidden />
          </motion.span>
        )}
      </div>
    </div>
  );
}

/** A browser and a phone showing the same product. */
function WebMobileScene() {
  const reduce = useReducedMotion();
  return (
    <div className="relative w-full max-w-[30rem]">
      <div className={cn(card, "w-[86%] overflow-hidden")}>
        <div className="flex h-6 items-center gap-1 border-b border-slate-100 bg-slate-50 px-2.5">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="size-1.5 rounded-full" style={{ background: c }} />
          ))}
          <span className="mx-auto rounded bg-slate-100 px-2 font-mono text-[0.5625rem] text-slate-500">app.yourbrand.com</span>
        </div>
        <div className="grid grid-cols-[1.1fr_1fr] gap-3 p-4">
          <div className="space-y-2">
            <span className="block h-2 w-1/3 rounded-full bg-teal-200" />
            <span className="block h-3 w-[90%] rounded bg-slate-800" />
            <span className="block h-3 w-[70%] rounded bg-teal-600" />
            <span className="block h-1.5 w-[80%] rounded-full bg-slate-200" />
            <span className="mt-2 block h-5 w-[42%] rounded-full bg-slate-900" />
          </div>
          <div className="rounded-lg bg-gradient-to-br from-teal-500 to-sky-400" />
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {["4.9★", "98%", "120k"].map((v) => (
            <div key={v} className="rounded-md border border-slate-100 px-2 py-1.5">
              <p className="font-display text-xs font-bold">{v}</p>
              <span className="block h-1 w-2/3 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <motion.div
        className="absolute -bottom-4 right-0 w-[28%] rounded-[1.1rem] bg-slate-900 p-[3px] shadow-2xl"
        style={{ aspectRatio: "9 / 19" }}
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-full overflow-hidden rounded-[0.95rem] bg-white p-[9%]">
          <span className="absolute left-1/2 top-[3%] h-[3%] w-[34%] -translate-x-1/2 rounded-full bg-slate-900" />
          <div className="mt-[30%] space-y-[8%]">
            <span className="block aspect-[16/10] rounded-lg bg-gradient-to-br from-teal-500 to-sky-400" />
            {[85, 65, 75].map((w, i) => (
              <span key={i} className="block h-1.5 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
            ))}
            <span className="block h-3 w-1/2 rounded-full bg-teal-600" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** A document travels through intake → AI extraction → human approval → done. */
function WorkflowScene() {
  const reduce = useReducedMotion();
  const steps = [
    { icon: FileText, label: "Intake", tone: "bg-white text-slate-700" },
    { icon: Sparkles, label: "AI extracts", tone: "bg-teal-50 text-teal-700" },
    { icon: UserCheck, label: "Approve", tone: "bg-sky-50 text-sky-700" },
    { icon: Check, label: "Done", tone: "bg-emerald-50 text-emerald-700" },
  ];
  return (
    <div className="relative w-full max-w-[30rem]">
      <div className="relative flex items-center justify-between">
        <div className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-white/40" />
        {!reduce && (
          <motion.span
            className="absolute top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-slate-700 shadow-lg"
            animate={{ left: ["4%", "30%", "30%", "56%", "56%", "84%", "84%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 0.35, 0.5, 0.7, 0.85, 1] }}
          >
            <FileText className="size-3.5" aria-hidden />
          </motion.span>
        )}
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative flex flex-col items-center gap-2">
              <span className={cn(card, "flex size-14 items-center justify-center rounded-2xl", s.tone)}>
                <Icon className="size-6" aria-hidden />
              </span>
              <span className="text-[0.6875rem] font-semibold text-white">{s.label}</span>
            </div>
          );
        })}
      </div>
      <div className={cn(card, "mx-auto mt-7 w-[82%] p-3")}>
        <div className="flex items-center justify-between text-[0.6875rem]">
          <span className="font-semibold">Invoice INV-2048</span>
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">Auto-routed</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[0.625rem] text-slate-500">
          {[
            ["Vendor", "Acme Ltd"],
            ["Amount", "$12,480"],
            ["SLA", "2h left"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md bg-slate-50 px-2 py-1">
              <p className="uppercase tracking-wider">{k}</p>
              <p className="font-semibold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A live command center: KPIs, a trend and an AI alert. */
function DataScene() {
  const reduce = useReducedMotion();
  const pts = [28, 34, 30, 44, 41, 52, 50, 62, 60, 72];
  const d = pts.map((y, i) => `${i ? "L" : "M"} ${(i / (pts.length - 1)) * 300} ${90 - y}`).join(" ");
  return (
    <div className="relative mb-6 w-full max-w-[30rem]">
      <div className={cn(card, "p-4")}>
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold">Operations command center</span>
          <span className="flex items-center gap-1.5 text-[0.625rem] font-semibold text-emerald-600">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Revenue", "$1.24M", "+8%"],
            ["Orders", "18,402", "+12%"],
            ["NPS", "71", "+5"],
          ].map(([k, v, c]) => (
            <div key={k} className="rounded-lg bg-slate-50 px-2.5 py-2">
              <p className="text-[0.5625rem] uppercase tracking-wider text-slate-400">{k}</p>
              <p className="font-display text-sm font-bold">{v}</p>
              <p className="text-[0.5625rem] font-semibold text-emerald-600">{c}</p>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 300 90" className="mt-3 h-20 w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="svc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="1" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L 300 90 L 0 90 Z`} fill="url(#svc-fill)" />
          <motion.path
            d={d}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <path d="M 300 18 L 300 90" stroke="#0d9488" strokeDasharray="3 4" strokeWidth="1" />
        </svg>
      </div>
      <motion.div
        className={cn(card, "absolute -bottom-10 -right-4 flex max-w-[14rem] items-start gap-2 p-3")}
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-sky-500 text-white">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <span className="text-[0.6875rem] leading-snug">
          <span className="block font-semibold">AI insight</span>
          Demand in the North region is likely to rise 14% next week. Restock suggested.
        </span>
      </motion.div>
    </div>
  );
}
