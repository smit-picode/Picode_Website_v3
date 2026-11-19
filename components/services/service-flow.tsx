"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import { Bot, Check, ChevronsLeftRight, Sparkles } from "lucide-react";
import { services } from "@/lib/content/services";
import { cn } from "@/lib/utils";

/**
 * Hero graphic: a before → after "transformation scanner". A teal scan line sweeps left to
 * right across a messy legacy screen and leaves a clean, modern one behind it. One pair per service; the
 * visitor can drag the scanner to compare.
 *
 * Screens are designed at a fixed 640×470 and scaled to fit, so they stay crisp at any size.
 */

const DW = 640;
const DH = 470;
const HOLD_MS = 2200;

export function ServiceFlow() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const x = useMotionValue(reduce ? 50 : 0); // scan position, % from the left
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Fit the fixed-size design into the available width.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e!.contentRect.width / DW));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sweep → hold on "after" → next service.
  useEffect(() => {
    if (reduce || dragging) return;
    let cancelled = false;
    let timer = 0;
    x.set(0);
    const ctl = animate(x, 100, {
      duration: 2.6,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        if (cancelled) return;
        timer = window.setTimeout(() => setActive((v) => (v + 1) % services.length), HOLD_MS);
      },
    });
    return () => {
      cancelled = true;
      ctl.stop();
      window.clearTimeout(timer);
    };
  }, [active, dragging, reduce, x]);

  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };

  const clip = useTransform(x, (v) => `inset(0 ${100 - v}% 0 0)`);
  const left = useTransform(x, (v) => `${v}%`);
  const [pct, setPct] = useState(0);
  useMotionValueEvent(x, "change", (v) => setPct(Math.round(v)));

  const s = services[active]!;
  const pair = PAIRS[active]!;

  return (
    <div>
      <div
        ref={frameRef}
        className="relative cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-[1.75rem] border border-gray-200/90 bg-white shadow-[0_50px_100px_-50px_rgba(15,23,42,0.45),0_20px_40px_-30px_rgba(13,148,136,0.35)]"
        style={{ height: DH * scale }}
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          drag(e);
        }}
        onPointerMove={(e) => dragging && drag(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        aria-label={`${s.short}: before and after`}
        role="img"
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: DW, height: DH, transform: `scale(${scale})` }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={s.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              {/* before */}
              <div className="absolute inset-0">{pair.before}</div>
              {/* after, revealed behind the scanner */}
              <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
                {pair.after}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* scanner */}
        <motion.div className="pointer-events-none absolute inset-y-0 z-10 -translate-x-1/2" style={{ left }}>
          <div className="absolute inset-y-0 left-1/2 w-16 -translate-x-full bg-gradient-to-l from-primary/25 to-transparent" />
          <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-primary shadow-[0_0_18px_4px_rgba(45,212,191,0.6)]" />
          <div className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-gradient-primary text-white shadow-glow">
            <ChevronsLeftRight className="size-4" aria-hidden />
          </div>
        </motion.div>

        {/* corner tags */}
        <span className="absolute bottom-4 right-4 z-20 rounded-md bg-gray-900/75 px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white backdrop-blur" style={{ opacity: pct < 85 ? 1 : 0, transition: "opacity .3s" }}>
          Before
        </span>
        <span className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-md bg-gradient-primary px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white" style={{ opacity: pct > 15 ? 1 : 0, transition: "opacity .3s" }}>
          <Sparkles className="size-3" aria-hidden /> After
        </span>
      </div>

      {/* service selector + caption */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2" role="tablist" aria-label="Services">
        {services.map((svc, k) => {
          const on = k === active;
          return (
            <button
              key={svc.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(k)}
              className={cn("relative pb-1.5 font-display text-sm font-semibold transition-colors", on ? "text-gray-900" : "text-gray-400 hover:text-gray-700")}
            >
              <span className="mr-1.5 font-mono text-[0.625rem] font-medium text-primary-strong">{svc.number}</span>
              {svc.short}
              {on && <motion.span layoutId="ba-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-primary" />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 min-h-[3rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{pair.result}</span> {s.summary}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen pairs                                                         */
/* ------------------------------------------------------------------ */

function Win({ title, children, dark }: { title: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className={cn("absolute inset-0 flex flex-col", dark ? "bg-[#0b1a12]" : "bg-[#f7f9fb]")}>
      <div className={cn("flex h-9 shrink-0 items-center gap-1.5 px-4", dark ? "bg-[#c0c0c0]" : "border-b border-slate-200 bg-white")}>
        {dark ? (
          <span className="font-mono text-[11px] font-bold text-black">▣ {title}</span>
        ) : (
          <>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
            ))}
            <span className="mx-auto rounded-md bg-slate-100 px-3 py-0.5 font-mono text-[10px] text-slate-500">{title}</span>
          </>
        )}
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

const pill = "rounded-full bg-slate-200";

const PAIRS: { result: string; before: ReactNode; after: ReactNode }[] = [
  /* 01 Agentic modernization */
  {
    result: "Legacy system → AI-enabled workspace.",
    before: (
      <Win title="ORDERS.EXE  v2.3  (c) 2004" dark>
        <div className="p-5 font-mono text-[12px] leading-6 text-[#33ff66]">
          <p>ORDER ENTRY SYSTEM — SCREEN 04 OF 19</p>
          <p className="text-[#33ff66]/60">────────────────────────────────────────────</p>
          {["00412  ACME LTD      PENDING   12,480.00", "00413  NORTHWIND     PENDING    3,150.00", "00414  GLOBEX CORP   ?ERR 0x1F  ********", "00415  INITECH       PENDING    8,904.50", "00416  UMBRELLA CO   PENDING   21,000.00"].map((r) => (
            <p key={r}>{r}</p>
          ))}
          <p className="mt-3">ENTER ORDER NO: <span className="animate-pulse">█</span></p>
          <p className="mt-6 text-[#33ff66]/70">F1=HELP  F3=EXIT  F7=PREV  F8=NEXT  F12=CANCEL</p>
        </div>
      </Win>
    ),
    after: (
      <Win title="ops.yourcompany.com">
        <div className="absolute inset-0 grid grid-cols-[140px_1fr_190px]">
          <div className="space-y-2 border-r border-slate-200 bg-white p-4">
            <p className="font-display text-sm font-bold text-slate-900">Operations</p>
            {["Orders", "Approvals", "Customers", "Reports"].map((n, i) => (
              <p key={n} className={cn("rounded-lg px-2 py-1.5 text-xs font-medium", i === 0 ? "bg-teal-50 text-teal-700" : "text-slate-500")}>{n}</p>
            ))}
          </div>
          <div className="space-y-2 p-4">
            <p className="font-display text-sm font-semibold text-slate-900">Open orders</p>
            {[
              ["Acme Ltd", "$12,480", "Ready"],
              ["Northwind", "$3,150", "Ready"],
              ["Globex Corp", "$9,720", "Fixed by agent"],
              ["Initech", "$8,904", "Ready"],
            ].map(([n, a, st]) => (
              <div key={n} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">
                <span className="font-semibold text-slate-800">{n}</span>
                <span className="text-slate-500">{a}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", st === "Ready" ? "bg-emerald-50 text-emerald-700" : "bg-teal-50 text-teal-700")}>{st}</span>
              </div>
            ))}
          </div>
          <div className="m-3 rounded-2xl border border-teal-200 bg-gradient-to-b from-teal-50 to-white p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
              <Bot className="size-4" aria-hidden /> Agent
            </p>
            <p className="mt-2 rounded-xl bg-white p-2.5 text-[11px] leading-relaxed text-slate-600 shadow-sm">
              I found a currency error on Globex and corrected it. 3 orders are ready for your approval.
            </p>
            <p className="mt-2 rounded-full bg-gradient-to-r from-teal-500 to-sky-500 py-1.5 text-center text-[11px] font-semibold text-white">Approve all</p>
          </div>
        </div>
      </Win>
    ),
  },
  /* 02 Web & mobile */
  {
    result: "Dated website → product people love.",
    before: (
      <div className="absolute inset-0 bg-[#e8e4d8] p-3 font-serif">
        <div className="flex items-center justify-between border-b-4 border-double border-[#7a2b2b] bg-[#f5f1e1] px-3 py-2">
          <span className="text-xl font-bold italic text-[#7a2b2b]">Welcome to Our Homepage!!!</span>
          <span className="text-[10px] text-blue-700 underline">Sitemap | Guestbook</span>
        </div>
        <p className="mt-1 bg-yellow-200 px-2 text-[11px] text-red-700">★ NEW!! ★ Best viewed in Internet Explorer 6 at 800×600 ★ Under construction ★</p>
        <div className="mt-2 grid grid-cols-[120px_1fr] gap-2">
          <div className="space-y-1 bg-[#d2cbb5] p-2 text-[11px] text-blue-800 underline">
            {["Home", "About Us", "Products", "Downloads", "Links", "Contact"].map((l) => (
              <p key={l}>» {l}</p>
            ))}
          </div>
          <div className="bg-white p-3 text-[11px] leading-snug text-slate-800">
            <p className="font-bold">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p className="mt-2">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.</p>
            <div className="mt-3 flex h-24 items-center justify-center border-2 border-dashed border-slate-400 text-slate-400">[ image.gif ]</div>
            <p className="mt-2 text-center text-[10px]">You are visitor #000417</p>
          </div>
        </div>
      </div>
    ),
    after: (
      <Win title="yourbrand.com">
        <div className="absolute inset-0 grid grid-cols-[1.2fr_1fr] gap-6 p-8">
          <div className="flex flex-col justify-center">
            <p className="w-max rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700">New · Book in 30 seconds</p>
            <p className="mt-4 font-display text-[30px] font-bold leading-[1.05] text-slate-900">Everything you need, one tap away.</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Fast, accessible and secure on every device.</p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Get started</span>
              <span className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Watch demo</span>
            </div>
            <div className="mt-6 flex gap-5 text-xs">
              <span><b className="font-display text-base text-slate-900">4.9★</b><br /><span className="text-slate-400">App Store</span></span>
              <span><b className="font-display text-base text-slate-900">120k</b><br /><span className="text-slate-400">users</span></span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-400 to-sky-400" />
            <div className="absolute left-1/2 top-6 h-[300px] w-[150px] -translate-x-1/2 rounded-[26px] bg-slate-900 p-1.5 shadow-2xl">
              <div className="h-full space-y-2 rounded-[21px] bg-white p-3 pt-6">
                <span className="block h-16 rounded-xl bg-gradient-to-br from-teal-500 to-sky-400" />
                <span className={cn(pill, "block h-2 w-4/5")} />
                <span className={cn(pill, "block h-2 w-3/5")} />
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 p-1.5">
                    <span className="size-6 rounded-md bg-teal-100" />
                    <span className={cn(pill, "h-1.5 flex-1")} />
                  </div>
                ))}
                <span className="block rounded-full bg-teal-600 py-1.5 text-center text-[9px] font-semibold text-white">Book now</span>
              </div>
            </div>
          </div>
        </div>
      </Win>
    ),
  },
  /* 03 Workflow automation */
  {
    result: "Inbox chaos → processes that run themselves.",
    before: (
      <Win title="Inbox (1,284 unread)">
        <div className="absolute inset-0 bg-white">
          {[
            ["Finance", "RE: RE: FW: invoice?? who approved this", "!!"],
            ["Sam", "FW: FW: updated_form_FINAL_v7(2).xlsx", ""],
            ["Priya", "Can someone check the vendor details again", "!"],
            ["Ops team", "RE: still waiting on sign-off (3rd reminder)", "!!"],
            ["Alex", "Printed, signed, scanned, attached", ""],
            ["Finance", "Which version is the right one???", "!"],
            ["Jordan", "RE: lost the original email, resending", ""],
          ].map(([f, t, p], i) => (
            <div key={i} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-[12px]">
              <span className="size-2 rounded-full bg-blue-500" />
              <span className="w-20 shrink-0 font-semibold text-slate-800">{f}</span>
              <span className="truncate text-slate-600">{t}</span>
              {p && <span className="ml-auto font-bold text-red-500">{p}</span>}
            </div>
          ))}
          <div className="absolute bottom-6 right-8 rotate-6 bg-yellow-200 p-3 text-[11px] font-medium text-slate-700 shadow-md">Chase approvals!!<br />Due FRIDAY</div>
          <div className="absolute bottom-14 right-40 -rotate-3 bg-pink-200 p-3 text-[11px] font-medium text-slate-700 shadow-md">Who owns this?</div>
        </div>
      </Win>
    ),
    after: (
      <Win title="flow.yourcompany.com">
        <div className="absolute inset-0 grid grid-cols-4 gap-3 p-4">
          {[
            { h: "Received", n: 3, cards: ["INV-2051", "INV-2052"] },
            { h: "AI extracted", n: 2, cards: ["INV-2049"], ai: true },
            { h: "Approval", n: 1, cards: ["INV-2048"] },
            { h: "Paid", n: 18, cards: ["INV-2044", "INV-2045"], done: true },
          ].map((col) => (
            <div key={col.h} className="rounded-2xl bg-slate-100/80 p-2.5">
              <p className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-700">
                {col.h} <span className="rounded-full bg-white px-1.5 text-[10px] text-slate-500">{col.n}</span>
              </p>
              <div className="mt-2 space-y-2">
                {col.cards.map((c) => (
                  <div key={c} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <p className="text-[11px] font-semibold text-slate-800">{c}</p>
                    <p className="text-[10px] text-slate-400">Acme Ltd · $12,480</p>
                    {col.ai && <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-teal-700"><Sparkles className="size-3" aria-hidden /> Fields extracted</p>}
                    {col.done && <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><Check className="size-3" aria-hidden /> Auto-reconciled</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-[11px] text-white">
            <span>Average approval time</span>
            <span className="font-display text-sm font-bold"><span className="text-slate-400 line-through">4 days</span>  →  <span className="text-teal-300">3 hours</span></span>
          </div>
        </div>
      </Win>
    ),
  },
  /* 04 Data-driven apps */
  {
    result: "Spreadsheet sprawl → one live picture.",
    before: (
      <Win title="Q3_report_FINAL_v12.xlsx">
        <div className="absolute inset-0 overflow-hidden bg-white font-mono text-[11px]">
          <div className="grid grid-cols-[36px_repeat(6,1fr)] border-b border-slate-300 bg-slate-100 text-center text-slate-500">
            {["", "A", "B", "C", "D", "E", "F"].map((h) => (
              <span key={h} className="border-r border-slate-300 py-1">{h}</span>
            ))}
          </div>
          {Array.from({ length: 13 }).map((_, r) => (
            <div key={r} className="grid grid-cols-[36px_repeat(6,1fr)] border-b border-slate-200 text-slate-700">
              <span className="border-r border-slate-300 bg-slate-100 py-1 text-center text-slate-500">{r + 1}</span>
              {Array.from({ length: 6 }).map((__, c) => {
                const v = (r * 7 + c * 13) % 23;
                const err = (r + c) % 9 === 4 ? "#REF!" : (r * c) % 11 === 7 ? "#DIV/0!" : null;
                return (
                  <span key={c} className={cn("truncate border-r border-slate-200 px-1.5 py-1 text-right", err && "bg-red-50 text-red-600", r === 0 && "bg-yellow-100 font-bold")}>
                    {r === 0 ? ["Region", "Q1", "Q2", "Q3", "Total", "Var"][c] : err ?? (v * 1043).toLocaleString("en-US")}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </Win>
    ),
    after: (
      <Win title="insights.yourcompany.com">
        <div className="absolute inset-0 space-y-3 p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Revenue", "$1.24M", "+8.2%"],
              ["Orders", "18,402", "+12%"],
              ["Margin", "34.6%", "+1.9pt"],
            ].map(([k, v, d]) => (
              <div key={k} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{k}</p>
                <p className="font-display text-lg font-bold text-slate-900">{v}</p>
                <p className="text-[10px] font-semibold text-emerald-600">{d}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1.5fr_1fr] gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold text-slate-700">Revenue by week</p>
              <div className="mt-3 flex h-[150px] items-end gap-2">
                {[40, 55, 48, 66, 60, 74, 70, 88, 82, 96].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i > 7 ? "linear-gradient(#14b8a6,#0ea5e9)" : "#cbd5e1" }} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50 to-white p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700"><Sparkles className="size-3.5" aria-hidden /> AI insight</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">North region demand is likely to rise 14% next week. Restock suggested.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold text-slate-700">Data sources</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600"><span className="size-1.5 rounded-full bg-emerald-500" /> 6 connected · live</p>
              </div>
            </div>
          </div>
        </div>
      </Win>
    ),
  },
];
