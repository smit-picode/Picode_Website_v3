"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The live preview beside the questionnaire. It picks up the "Your project" stage that closes
 * the case studies and fills it in as the visitor answers: the devices go from dashed
 * blueprints to real screens, and each answer pins a glass note to the stage, in the same
 * style as the portfolio.
 */

export type PreviewData = {
  types: string[];
  stage: string;
  timeline: string;
  budget: string;
  story: string;
  name: string;
  company: string;
};

const ACCENT = "#0D9488"; // the "Your project" stage colour in the case studies

type Screen = "site" | "dash" | "ai" | "flow" | "legacy" | "idea";

const SCREEN_FOR: Record<string, Screen> = {
  Website: "site",
  "Dashboard & data": "dash",
  "AI / agents": "ai",
  "Workflow automation": "flow",
  "Modernise legacy": "legacy",
  "Not sure yet": "idea",
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);

export function ProjectPreview({ data, refNo, sent }: { data: PreviewData; refNo: string; sent: boolean }) {
  const title = data.company || data.name || "Your project";
  const desktop = data.types.find((t) => SCREEN_FOR[t]);
  const screen: Screen | null = desktop ? SCREEN_FOR[desktop]! : null;
  const phone = data.types.includes("Mobile app");
  const browserOn = Boolean(screen) || (!phone && data.types.length > 0);
  const filled = [data.types.length > 0, data.stage, data.timeline, data.budget, data.story, data.name].filter(Boolean).length;
  const domain = `${slug(data.company || data.name) || "your-idea"}.com`;

  const notes = [
    data.stage && { k: "Stage", v: data.stage },
    data.timeline && { k: "Launch", v: data.timeline },
    data.budget && { k: "Budget", v: data.budget },
  ].filter(Boolean) as { k: string; v: string }[];

  const category = data.types.length ? data.types.join(" · ") : "Next up · Anything you can imagine";
  const quote = data.story ? (data.story.length > 70 ? `${data.story.slice(0, 70)}…` : data.story) : "";

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="relative isolate overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[0_40px_80px_-40px_rgba(13,148,136,0.7),0_12px_24px_-16px_rgba(15,23,42,0.35)] sm:p-6"
        style={{ background: `radial-gradient(120% 90% at 85% 0%, color-mix(in oklab, ${ACCENT} 70%, white), ${ACCENT} 45%, color-mix(in oklab, ${ACCENT} 55%, #0b1220))` }}
      >
        {/* kinetic outlined word in the background, like the case-study stages */}
        <p
          aria-hidden
          className="pointer-events-none absolute -bottom-12 left-1/2 -z-10 -translate-x-1/2 whitespace-nowrap font-display text-[7.5rem] font-bold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.09)]"
        >
          {title}
        </p>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

        {/* header: project mark, name, category */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white font-display text-sm font-bold" style={{ color: ACCENT }}>
                {title === "Your project" ? <Plus className="size-4" aria-hidden /> : title.charAt(0).toUpperCase()}
              </span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="truncate font-display text-lg font-semibold"
                >
                  {title}
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="mt-2 flex items-center gap-2 truncate font-display text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-white/75">
              <span className="h-px w-5 shrink-0 bg-white/50" aria-hidden />
              <span className="truncate">{category}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-black/20 px-2 py-1 font-mono text-[0.625rem] text-white/80">{refNo}</span>
        </div>

        {/* stage: devices + notes */}
        <div className="relative mt-5 aspect-[16/11]">
          <Browser on={browserOn} screen={screen} domain={domain} />
          <Phone on={phone} />

          <div className="absolute -right-1 top-[4%] flex w-[46%] flex-col items-end gap-2">
            <AnimatePresence initial={false}>
              {notes.map((n, i) => (
                <motion.div
                  key={n.k}
                  layout
                  initial={{ opacity: 0, x: 24, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className="rounded-xl border border-white/20 bg-[#0b1220]/60 px-3 py-2 shadow-[0_16px_32px_-16px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                >
                  <p className="flex items-center gap-1.5 text-[0.625rem] text-white/65">
                    <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
                    {n.k}
                  </p>
                  <motion.p key={n.v} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-display text-[0.8125rem] font-semibold leading-tight">
                    {n.v}
                  </motion.p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* headline: their own words, set like a case-study headline */}
        <div className="mt-4 min-h-[3.75rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={quote ? "q" : "empty"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-display text-[1.375rem] font-semibold leading-[1.15] tracking-tight"
            >
              {quote ? (
                <>“{quote}”</>
              ) : (
                <>
                  Your product, <span className="text-white/70">shipped next.</span>
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* footer: progress / received */}
        <div className="mt-4 flex items-center gap-3 border-t border-white/15 pt-4">
          {sent ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 font-display text-sm font-semibold"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-white" style={{ color: ACCENT }}>
                <Check className="size-3.5" aria-hidden />
              </span>
              Brief received. Case study in progress.
            </motion.p>
          ) : (
            <>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: `${(filled / 6) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              <span className="font-mono text-[0.6875rem] text-white/80">{filled}/6 drafted</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Devices: dashed blueprint until the visitor picks something          */
/* ------------------------------------------------------------------ */

const ghost = "rounded-md bg-white/[0.14]";

function Browser({ on, screen, domain }: { on: boolean; screen: Screen | null; domain: string }) {
  return (
    <motion.div
      animate={{ y: on ? 0 : 4 }}
      className={cn(
        "absolute left-0 top-0 w-[86%] overflow-hidden rounded-xl transition-[background-color,border-color,box-shadow] duration-500",
        on
          ? "border border-white/40 bg-white shadow-[0_24px_48px_-24px_rgba(0,0,0,0.6)]"
          : "border-2 border-dashed border-white/50 bg-white/[0.05]",
      )}
    >
      <div className={cn("flex h-6 items-center gap-1 px-2.5", on ? "border-b border-gray-100 bg-gray-50" : "border-b-2 border-dashed border-white/30")}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} className="size-1.5 rounded-full" style={on ? { background: c } : { border: "1px solid rgba(255,255,255,0.6)" }} />
        ))}
        <span className={cn("mx-auto rounded px-2 font-mono text-[0.5625rem]", on ? "bg-gray-100 text-gray-500" : "bg-white/10 text-white/75")}>{domain}</span>
      </div>
      <div className="relative aspect-[16/10]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={on ? screen ?? "site" : "blank"}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 p-[5%]"
          >
            {on ? <ScreenArt kind={screen ?? "site"} /> : <BlankArt />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Phone({ on }: { on: boolean }) {
  return (
    <motion.div
      animate={{ y: on ? 0 : 8 }}
      className={cn(
        "absolute bottom-0 right-[2%] w-[24%] rounded-[1.1rem] p-[3px] transition-[background-color,border-color,box-shadow] duration-500",
        on ? "bg-[#0b1220] shadow-[0_24px_40px_-16px_rgba(0,0,0,0.7)]" : "border-2 border-dashed border-white/50 bg-white/[0.05]",
      )}
      style={{ aspectRatio: "9 / 19" }}
    >
      <div className={cn("relative h-full overflow-hidden rounded-[0.95rem] p-[9%]", on ? "bg-white" : "")}>
        <span className={cn("absolute left-1/2 top-[3%] h-[3%] w-[34%] -translate-x-1/2 rounded-full", on ? "bg-[#0b1220]" : "border border-white/50")} />
        <div className="mt-[30%] flex flex-col gap-[6%]">
          <span className={cn("aspect-[16/10] w-full rounded-lg", on ? "" : ghost)} style={on ? { background: `linear-gradient(135deg, ${ACCENT}, #38bdf8)` } : undefined} />
          {[88, 70, 80, 56].map((w, i) => (
            <span key={i} className={cn("h-1.5 rounded-full", on ? "bg-gray-200" : "bg-white/20")} style={{ width: `${w}%` }} />
          ))}
          <span className={cn("mt-[6%] h-3 w-1/2 rounded-full", on ? "" : "border border-dashed border-white/50")} style={on ? { background: ACCENT } : undefined} />
        </div>
      </div>
    </motion.div>
  );
}

function BlankArt() {
  return (
    <div className="grid h-full grid-cols-[1.1fr_1fr] gap-[5%]">
      <div className="flex flex-col justify-center gap-[7%]">
        <span className={cn(ghost, "h-[8%] w-1/3 rounded-full")} />
        <span className={cn(ghost, "h-[14%] w-[90%]")} />
        <span className={cn(ghost, "h-[14%] w-[70%]")} />
        <span className="mt-[4%] h-[12%] w-[40%] rounded-full border-2 border-dashed border-white/50" />
      </div>
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-white/40">
        <motion.span
          className="flex size-9 items-center justify-center rounded-full bg-white/15"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plus className="size-4" aria-hidden />
        </motion.span>
      </div>
    </div>
  );
}

/** A tiny, recognisable screen for each kind of product. */
function ScreenArt({ kind }: { kind: Screen }) {
  const line = "h-1.5 rounded-full bg-gray-200";
  switch (kind) {
    case "dash":
      return (
        <div className="flex h-full flex-col gap-[6%]">
          <div className="grid grid-cols-3 gap-[4%]">
            {["$84k", "1.2k", "98%"].map((v) => (
              <div key={v} className="rounded-md border border-gray-100 p-[8%]">
                <span className="block h-1 w-1/2 rounded-full bg-gray-200" />
                <span className="mt-1 block font-display text-[0.625rem] font-bold text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-1 items-end gap-[3%] rounded-md border border-gray-100 p-[4%]">
            {[40, 55, 48, 70, 62, 85, 92].map((h, i) => (
              <motion.span
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 140, damping: 18 }}
                className="flex-1 rounded-sm"
                style={{ background: i === 6 ? ACCENT : "#bae6fd" }}
              />
            ))}
          </div>
        </div>
      );
    case "ai":
      return (
        <div className="flex h-full flex-col justify-end gap-[5%]">
          <span className="ml-auto max-w-[70%] rounded-lg rounded-br-sm px-2 py-1 text-[0.5rem] font-medium text-white" style={{ background: ACCENT }}>
            Summarise this week&apos;s tickets
          </span>
          <span className="max-w-[78%] rounded-lg rounded-bl-sm bg-gray-100 px-2 py-1 text-[0.5rem] text-gray-700">
            Done. 3 themes, 2 urgent. Drafting replies now…
          </span>
          <span className="flex h-[16%] items-center rounded-full border border-gray-200 px-2">
            <span className={cn(line, "w-1/2")} />
          </span>
        </div>
      );
    case "flow":
      return (
        <div className="relative flex h-full items-center justify-between px-[4%]">
          <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 border-t border-dashed border-gray-300" />
          {["Trigger", "AI step", "Approve", "Done"].map((t, i) => (
            <motion.span
              key={t}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-md border bg-white px-1.5 py-1 text-[0.5rem] font-semibold"
              style={{ borderColor: i === 1 ? ACCENT : "#e5e7eb", color: i === 1 ? ACCENT : "#374151" }}
            >
              {t}
            </motion.span>
          ))}
        </div>
      );
    case "legacy":
      return (
        <div className="grid h-full grid-cols-2 gap-[5%]">
          <div className="flex flex-col gap-[7%] rounded-md bg-gray-100 p-[7%]">
            <span className="font-mono text-[0.5rem] text-gray-400">legacy.exe</span>
            {[80, 60, 70, 45].map((w, i) => (
              <span key={i} className="h-1 rounded-full bg-gray-300" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex flex-col gap-[7%] rounded-md p-[7%]" style={{ background: `${ACCENT}14` }}>
            <span className="font-mono text-[0.5rem]" style={{ color: ACCENT }}>
              modern.app
            </span>
            {[85, 65, 75, 50].map((w, i) => (
              <span key={i} className="h-1 rounded-full" style={{ width: `${w}%`, background: `${ACCENT}66` }} />
            ))}
          </div>
        </div>
      );
    case "idea":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-[6%] text-center">
          <span className="font-display text-[0.75rem] font-semibold text-gray-800">Let&apos;s figure it out together</span>
          <span className={cn(line, "w-1/2")} />
          <span className="h-3 w-1/4 rounded-full" style={{ background: ACCENT }} />
        </div>
      );
    default:
      return (
        <div className="grid h-full grid-cols-[1.1fr_1fr] gap-[5%]">
          <div className="flex flex-col justify-center gap-[7%]">
            <span className="h-[8%] w-1/3 rounded-full" style={{ background: `${ACCENT}33` }} />
            <span className="h-[12%] w-[90%] rounded bg-gray-800" />
            <span className="h-[12%] w-[65%] rounded" style={{ background: ACCENT }} />
            <span className={cn(line, "w-[80%]")} />
            <span className="mt-[4%] h-[12%] w-[38%] rounded-full bg-gray-900" />
          </div>
          <div className="rounded-lg" style={{ background: `linear-gradient(135deg, ${ACCENT}, #38bdf8)` }} />
        </div>
      );
  }
}
