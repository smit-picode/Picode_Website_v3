"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, Inbox, MailOpen, Sparkles, TrendingUp } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const INQUIRIES = [
  { name: "Priya S.", topic: "AI support assistant", country: "IN" },
  { name: "Lukas M.", topic: "Fintech mobile app", country: "DE" },
  { name: "Aisha K.", topic: "Analytics dashboard", country: "AE" },
  { name: "Daniel R.", topic: "Invoice automation", country: "US" },
  { name: "Mei L.", topic: "Cloud migration", country: "SG" },
];

const BARS = [38, 52, 44, 66, 58, 80, 72];

/** Left panel: a softly animated preview of what's inside the console. */
export function LoginShowcase() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2600);
    return () => window.clearInterval(id);
  }, [reduce]);

  const visible = [0, 1, 2].map((k) => INQUIRIES[(tick + k) % INQUIRIES.length]!);
  const count = 128 + tick;

  return (
    <aside className="relative hidden overflow-hidden bg-[#071019] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* animated aurora */}
      <motion.div
        aria-hidden
        className="absolute -left-40 -top-40 size-[44rem] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.35),transparent)]"
        animate={reduce ? undefined : { x: [0, 80, 0], y: [0, 60, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-48 -right-32 size-[40rem] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.28),transparent)]"
        animate={reduce ? undefined : { x: [0, -70, 0], y: [0, -50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
      />

      <div className="relative">
        <Logo className="h-9" href="/" />
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 max-w-md font-display text-4xl font-semibold leading-tight !text-white xl:text-5xl"
        >
          Everything your team needs, <span className="text-gradient-primary">in one console.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="mt-4 max-w-md text-sm leading-relaxed text-white/60"
        >
          Review new inquiries, manage offices and keep contact details up to date — securely.
        </motion.p>
      </div>

      {/* floating preview cards */}
      <div className="relative mt-12 h-[22rem] [perspective:1200px]">
        <motion.div
          initial={{ opacity: 0, rotateX: 18, y: 30 }}
          animate={{ opacity: 1, rotateX: 8, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 right-16 top-0 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl [transform-style:preserve-3d]"
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Inbox className="size-4 text-teal-300" aria-hidden /> Latest inquiries
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/15 px-2.5 py-1 text-[0.6875rem] font-semibold text-teal-200">
              <span className="size-1.5 animate-pulse rounded-full bg-teal-300" /> Live
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((q, i) => (
                <motion.li
                  key={`${q.name}-${tick + i}`}
                  layout
                  initial={{ opacity: 0, y: -14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-2.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-sky-400 text-xs font-bold text-slate-900">
                    {q.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{q.name}</span>
                    <span className="block truncate text-xs text-white/50">{q.topic}</span>
                  </span>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-white/60">
                    {q.country}
                  </span>
                  {i === 0 && <MailOpen className="size-4 text-teal-300" aria-hidden />}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0, y: reduce ? 0 : [0, -8, 0] }}
          transition={{
            opacity: { delay: 0.5 },
            x: { delay: 0.5 },
            y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute -right-2 -bottom-6 w-56 rounded-2xl border border-white/10 bg-[#0c1a26]/90 p-4 shadow-2xl backdrop-blur-xl"
        >
          <p className="flex items-center gap-1.5 text-xs text-white/50">
            <TrendingUp className="size-3.5 text-teal-300" aria-hidden /> Inquiries this month
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{count}</p>
          <div className="mt-3 flex h-12 items-end gap-1">
            {BARS.map((h, i) => (
              <motion.span
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-teal-400 to-sky-400"
                initial={{ height: 0 }}
                animate={{ height: `${reduce ? h : Math.min(100, h + ((tick * 17 + i * 23) % 20))}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0, y: reduce ? 0 : [0, 7, 0] }}
          transition={{
            opacity: { delay: 0.65 },
            x: { delay: 0.65 },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-6 left-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0c1a26]/90 px-4 py-3 shadow-2xl backdrop-blur-xl"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
            <Building2 className="size-4" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-medium">Offices & contacts</span>
            <span className="block text-xs text-white/50">Update details in one place</span>
          </span>
        </motion.div>
      </div>

      <p className="relative mt-10 flex items-center gap-2 text-xs text-white/40">
        <Sparkles className="size-3.5 text-teal-300" aria-hidden /> Picode Admin Console
      </p>
    </aside>
  );
}
