"use client";

/* eslint-disable @next/next/no-img-element -- uploaded media is served by our own route */

import type { CSSProperties, ReactNode } from "react";
import { motion, type MotionValue } from "framer-motion";
import type { CaseStudy } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Scroll = MotionValue<number> | number;

/**
 * Screen content that can "scroll": `--p` (0–1) moves a tall screenshot from its
 * top to its bottom inside the fixed-size viewport (container-type: size → cqh).
 */
function Scroller({ progress, children }: { progress: Scroll; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-x-0 top-0 will-change-transform"
      style={{ "--p": progress, transform: "translateY(calc(var(--p) * (100cqh - 100%)))" } as never}
    >
      {children}
    </motion.div>
  );
}

const tint = (accent: string, pct: number, base = "white") => `color-mix(in oklab, ${accent} ${pct}%, ${base})`;

/* ------------------------------------------------------------------ */
/* Brand mark                                                           */
/* ------------------------------------------------------------------ */

export function ProjectMark({
  study,
  className,
  invert,
}: {
  study: Pick<CaseStudy, "name" | "logo" | "accent">;
  className?: string;
  invert?: boolean;
}) {
  if (study.logo) {
    return (
      <img
        src={study.logo}
        alt={`${study.name} logo`}
        className={cn("h-7 w-auto object-contain", invert && "brightness-0 invert", className)}
      />
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-semibold", className)}>
      <span
        className="inline-flex size-7 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ background: invert ? "rgba(255,255,255,0.18)" : study.accent }}
        aria-hidden
      >
        {study.name.charAt(0)}
      </span>
      {study.name}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Browser                                                              */
/* ------------------------------------------------------------------ */

export function BrowserFrame({
  study,
  progress = 0,
  className,
}: {
  study: CaseStudy;
  progress?: Scroll;
  className?: string;
}) {
  const host = hostOf(study);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[clamp(0.6rem,1.2vw,1rem)] border border-black/5 bg-[#f6f6f4] shadow-[0_40px_80px_-30px_rgba(15,23,42,0.35),0_12px_24px_-12px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#1b2333]",
        className,
      )}
    >
      <div className="flex h-[clamp(1.5rem,2.6vw,2.1rem)] items-center gap-1.5 border-b border-black/5 px-3 dark:border-white/10">
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <span className="mx-auto flex h-[60%] w-2/5 min-w-0 items-center justify-center truncate rounded-md bg-black/[0.05] px-2 text-[clamp(0.5rem,0.7vw,0.6875rem)] text-gray-500 dark:bg-white/10 dark:text-white/50">
          {host}
        </span>
        <span className="w-8" />
      </div>
      <div className="relative aspect-[16/10] overflow-hidden bg-white [container-type:size]">
        <Scroller progress={progress}>
          {study.desktopImage ? (
            <img src={study.desktopImage} alt={`${study.name} website`} className="block w-full" draggable={false} />
          ) : (
            <MockWebsite study={study} />
          )}
        </Scroller>
      </div>
    </div>
  );
}

function hostOf(study: CaseStudy) {
  if (study.url) {
    try {
      return new URL(study.url).host.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return `${study.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
}

/** Generated landing page in the project's colours (sized in cqw so it scales with the frame). */
function MockWebsite({ study }: { study: CaseStudy }) {
  const a = study.accent;
  const s: Record<string, CSSProperties> = {
    root: { background: tint(a, 6), color: "#14181f", fontSize: "1cqw", height: "175cqh" },
  };
  return (
    <div style={s.root} className="font-display">
      {/* nav */}
      <div className="flex items-center justify-between" style={{ padding: "2.2cqw 4cqw" }}>
        <span className="flex items-center font-semibold" style={{ gap: "0.8cqw", fontSize: "1.6cqw" }}>
          <span
            className="flex items-center justify-center rounded-[0.5cqw] font-bold text-white"
            style={{ width: "2.6cqw", height: "2.6cqw", background: a, fontSize: "1.4cqw" }}
          >
            {study.name.charAt(0)}
          </span>
          {study.name}
        </span>
        <span className="flex text-[#5b6170]" style={{ gap: "3cqw", fontSize: "1.15cqw" }}>
          <span>Work</span>
          <span>Services</span>
          <span>About</span>
          <span>Journal</span>
        </span>
        <span
          className="rounded-full font-semibold text-white"
          style={{ background: a, padding: "0.9cqw 2cqw", fontSize: "1.1cqw" }}
        >
          Get started
        </span>
      </div>

      {/* hero */}
      <div className="grid grid-cols-[1.05fr_1fr] items-center" style={{ gap: "3cqw", padding: "3cqw 4cqw 0" }}>
        <div>
          <span
            className="inline-flex items-center rounded-full bg-white"
            style={{ gap: "0.6cqw", padding: "0.5cqw 1.2cqw", fontSize: "0.95cqw", color: "#5b6170" }}
          >
            <span className="rounded-full" style={{ width: "0.7cqw", height: "0.7cqw", background: a }} />
            {study.category}
          </span>
          <p className="font-semibold" style={{ fontSize: "4.6cqw", lineHeight: 1.02, letterSpacing: "-0.04em", marginTop: "1.8cqw" }}>
            {study.headline}
            <br />
            <span style={{ color: a }}>{study.headlineAccent}</span>
          </p>
          <p className="line-clamp-3 font-sans text-[#5b6170]" style={{ fontSize: "1.2cqw", lineHeight: 1.55, marginTop: "1.8cqw", maxWidth: "36cqw" }}>
            {study.summary}
          </p>
          <div className="flex items-center" style={{ gap: "1.4cqw", marginTop: "2.4cqw" }}>
            <span className="rounded-full font-semibold text-white" style={{ background: a, padding: "1.1cqw 2.4cqw", fontSize: "1.15cqw" }}>
              Explore now →
            </span>
            <span className="text-[#5b6170]" style={{ fontSize: "1.1cqw" }}>
              Learn how it works
            </span>
          </div>
        </div>
        {/* visual */}
        <div className="relative" style={{ height: "36cqw" }}>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              borderRadius: "2cqw",
              background: `radial-gradient(120% 90% at 80% 10%, ${tint(a, 55)}, transparent 60%), linear-gradient(150deg, ${a}, ${tint(a, 70, "black")})`,
            }}
          >
            <span
              className="absolute rounded-full"
              style={{ width: "26cqw", height: "26cqw", right: "-6cqw", bottom: "-8cqw", background: tint(a, 40), opacity: 0.45 }}
            />
            <span
              className="absolute rounded-full border border-white/30"
              style={{ width: "16cqw", height: "16cqw", left: "5cqw", top: "6cqw" }}
            />
            <span
              className="absolute rounded-full border border-white/20"
              style={{ width: "24cqw", height: "24cqw", left: "1cqw", top: "2cqw" }}
            />
          </div>
          <div
            className="absolute bg-white shadow-xl"
            style={{ left: "-3cqw", bottom: "3cqw", width: "21cqw", borderRadius: "1.2cqw", padding: "1.4cqw" }}
          >
            <p className="font-semibold" style={{ fontSize: "1.15cqw" }}>
              {study.services[0]?.title}
            </p>
            <div className="flex items-end" style={{ gap: "0.5cqw", height: "4cqw", marginTop: "1cqw" }}>
              {[40, 62, 50, 78, 66, 92].map((h, i) => (
                <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 5 ? a : tint(a, 25) }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* stats */}
      <div
        className="grid grid-cols-3 bg-white"
        style={{ margin: "4cqw 4cqw 0", borderRadius: "1.4cqw", padding: "2cqw 0" }}
      >
        {study.services.slice(0, 3).concat(study.services.length < 3 ? [{ title: "Launched", description: "" }] : []).slice(0, 3).map((sv, i) => (
          <div key={i} style={{ padding: "0 2.4cqw", borderLeft: i ? "1px solid #eee" : undefined }}>
            <p className="font-semibold" style={{ fontSize: "2.6cqw", color: i === 0 ? a : "#14181f" }}>
              {["48h", "4.9★", "99%"][i]}
            </p>
            <p className="truncate text-[#6b7180]" style={{ fontSize: "1cqw" }}>
              {sv.title}
            </p>
          </div>
        ))}
      </div>

      {/* cards */}
      <p className="font-semibold" style={{ fontSize: "2.6cqw", padding: "5cqw 4cqw 2cqw", letterSpacing: "-0.03em" }}>
        Made for the way you live.
      </p>
      <div className="grid grid-cols-3" style={{ gap: "2cqw", padding: "0 4cqw" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden bg-white" style={{ borderRadius: "1.4cqw" }}>
            <div
              style={{
                height: "16cqw",
                background: `linear-gradient(${140 + i * 30}deg, ${tint(a, 85 - i * 20)}, ${tint(a, 30 + i * 10)})`,
              }}
            />
            <div style={{ padding: "1.4cqw" }}>
              <p className="font-semibold" style={{ fontSize: "1.25cqw" }}>
                {["Discover", "Book in seconds", "Share the moment"][i]}
              </p>
              <span className="block rounded-full bg-[#eceef2]" style={{ height: "0.7cqw", width: "80%", marginTop: "0.9cqw" }} />
              <span className="block rounded-full bg-[#eceef2]" style={{ height: "0.7cqw", width: "55%", marginTop: "0.6cqw" }} />
            </div>
          </div>
        ))}
      </div>
      <div
        className="text-white"
        style={{ margin: "4cqw", borderRadius: "2cqw", padding: "4cqw", background: `linear-gradient(120deg, ${tint(a, 80, "black")}, ${a})` }}
      >
        <p className="font-semibold" style={{ fontSize: "2.6cqw" }}>
          Ready when you are.
        </p>
        <span className="mt-[1.6cqw] inline-block rounded-full bg-white font-semibold" style={{ color: a, padding: "1cqw 2.2cqw", fontSize: "1.1cqw" }}>
          Get started
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phone                                                                */
/* ------------------------------------------------------------------ */

export function PhoneFrame({
  study,
  progress = 0,
  variant = 0,
  className,
}: {
  study: CaseStudy;
  progress?: Scroll;
  /** Alternate generated screen (used for the second phone). */
  variant?: 0 | 1;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[18%/8.3%] bg-[#0d0f14] p-[3.2%] shadow-[0_40px_70px_-25px_rgba(15,23,42,0.55),0_10px_20px_-10px_rgba(15,23,42,0.3)] ring-1 ring-black/40",
        className,
      )}
    >
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[15%/7%] bg-white [container-type:size]">
        <Scroller progress={progress}>
          {study.mobileImage ? (
            <img src={study.mobileImage} alt={`${study.name} app`} className="block w-full" draggable={false} />
          ) : (
            <MockApp study={study} variant={variant} />
          )}
        </Scroller>
        <span className="absolute left-1/2 top-[1.6%] h-[3.6%] w-[32%] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      </div>
    </div>
  );
}

/** Generated app screen in the project's colours (sized in cqw). */
function MockApp({ study, variant }: { study: CaseStudy; variant: 0 | 1 }) {
  const a = study.accent;
  const items =
    variant === 0
      ? [...study.services.map((s) => s.title), "Saved for later", "Recommended for you"].slice(0, 4)
      : ["Today", "This weekend", "Near you", "Top picks"];
  return (
    <div className="font-display text-[#14181f]" style={{ background: tint(a, 5), height: "112cqh", padding: "0 5cqw" }}>
      {/* status bar */}
      <div className="flex justify-between font-semibold" style={{ fontSize: "3.6cqw", padding: "4cqw 3cqw 0" }}>
        <span>9:41</span>
        <span className="tracking-tighter">●●● ▮</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: "7cqw" }}>
        <div>
          <p className="text-[#6b7180]" style={{ fontSize: "3.4cqw" }}>
            {variant === 0 ? "Good morning," : "Explore"}
          </p>
          <p className="font-semibold" style={{ fontSize: "6cqw", letterSpacing: "-0.03em" }}>
            {variant === 0 ? "Jamie." : study.name}
          </p>
        </div>
        <span
          className="flex items-center justify-center rounded-full font-bold text-white"
          style={{ width: "10cqw", height: "10cqw", background: a, fontSize: "4cqw" }}
        >
          {variant === 0 ? "J" : study.name.charAt(0)}
        </span>
      </div>

      {/* hero card */}
      <div
        className="relative overflow-hidden text-white"
        style={{
          marginTop: "5cqw",
          borderRadius: "5cqw",
          padding: "5cqw",
          background: `radial-gradient(90% 80% at 90% 0%, ${tint(a, 60)}, transparent 60%), linear-gradient(150deg, ${a}, ${tint(a, 65, "black")})`,
        }}
      >
        <p className="uppercase tracking-wider opacity-70" style={{ fontSize: "2.6cqw" }}>
          {study.category.split("·")[0]}
        </p>
        <p className="font-semibold" style={{ fontSize: "7cqw", lineHeight: 1.05, marginTop: "2cqw", letterSpacing: "-0.03em" }}>
          {variant === 0 ? study.headline : study.headlineAccent || study.headline}
        </p>
        <div className="flex items-center justify-between" style={{ marginTop: "5cqw" }}>
          <span className="flex" style={{ gap: "1.2cqw" }}>
            {[1, 1, 1, 0.35, 0.35].map((o, i) => (
              <span key={i} className="rounded-full bg-white" style={{ width: "5cqw", height: "1.1cqw", opacity: o }} />
            ))}
          </span>
          <span className="rounded-full bg-white font-semibold" style={{ color: a, fontSize: "3cqw", padding: "1.6cqw 3.4cqw" }}>
            {variant === 0 ? "Start →" : "Book"}
          </span>
        </div>
        <span
          className="absolute rounded-full border-white/25"
          style={{ width: "30cqw", height: "30cqw", right: "-10cqw", top: "-10cqw", borderWidth: "2.5cqw" }}
        />
      </div>

      {/* list */}
      <div className="flex items-baseline justify-between" style={{ marginTop: "6cqw" }}>
        <p className="font-semibold" style={{ fontSize: "4cqw" }}>
          {variant === 0 ? "Your plan" : "Curated for you"}
        </p>
        <p className="text-[#6b7180]" style={{ fontSize: "3cqw" }}>
          See all
        </p>
      </div>
      <div className="bg-white" style={{ marginTop: "3cqw", borderRadius: "4cqw", padding: "1cqw 4cqw" }}>
        {items.map((t, i) => (
          <div
            key={t}
            className="flex items-center"
            style={{ gap: "3cqw", padding: "3.4cqw 0", borderTop: i ? "1px solid #f0f1f4" : undefined }}
          >
            <span
              className="flex shrink-0 items-center justify-center rounded-[2cqw] font-bold"
              style={{
                width: "8cqw",
                height: "8cqw",
                fontSize: "3cqw",
                background: i < 2 ? a : tint(a, 14),
                color: i < 2 ? "white" : a,
              }}
            >
              {i < 2 ? "✓" : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold" style={{ fontSize: "3.3cqw" }}>
                {t}
              </span>
              <span className="block rounded-full bg-[#eceef2]" style={{ height: "1.4cqw", width: "60%", marginTop: "1.4cqw" }} />
            </span>
            <span className="text-[#9097a5]" style={{ fontSize: "2.8cqw" }}>
              {i < 2 ? "Done" : `${i + 2} min`}
            </span>
          </div>
        ))}
      </div>
      <div
        className="flex items-center bg-white"
        style={{ marginTop: "4cqw", borderRadius: "4cqw", padding: "3.4cqw 4cqw", gap: "3cqw", border: `1px solid ${tint(a, 30)}` }}
      >
        <span className="rounded-[2cqw]" style={{ width: "8cqw", height: "8cqw", background: tint(a, 18) }} />
        <span className="flex-1">
          <span className="block font-semibold uppercase" style={{ fontSize: "2.4cqw", color: a }}>
            Next up
          </span>
          <span className="block font-semibold" style={{ fontSize: "3.3cqw" }}>
            Thu 12 Nov · 18:10
          </span>
        </span>
      </div>
      <div
        className="grid grid-cols-4 text-center text-[#9097a5]"
        style={{ marginTop: "6cqw", fontSize: "2.6cqw", borderTop: "1px solid #eceef2", paddingTop: "3cqw" }}
      >
        {["Today", "Plan", "Saved", "Profile"].map((t, i) => (
          <span key={t} style={{ color: i === 0 ? a : undefined, fontWeight: i === 0 ? 600 : 400 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composition                                                          */
/* ------------------------------------------------------------------ */

/** Browser + phone (or two phones) arranged like a product shot. */
export function DeviceStage({
  study,
  web = 0,
  phone = 0,
  className,
}: {
  study: CaseStudy;
  /** Scroll position of the website / app screens (0–1). */
  web?: Scroll;
  phone?: Scroll;
  className?: string;
}) {
  if (study.preview === "mobile") {
    return (
      <div className={cn("relative mx-auto aspect-[16/12] w-full", className)}>
        <PhoneFrame study={study} progress={phone} variant={1} className="absolute left-[14%] top-[8%] w-[30%] -rotate-[5deg] opacity-95" />
        <PhoneFrame study={study} progress={phone} className="absolute left-[44%] top-[2%] w-[34%] rotate-[3deg]" />
      </div>
    );
  }
  if (study.preview === "web") {
    return (
      <div className={cn("relative mx-auto aspect-[16/12] w-full", className)}>
        <BrowserFrame study={study} progress={web} className="absolute inset-x-0 top-[8%]" />
      </div>
    );
  }
  return (
    <div className={cn("relative mx-auto aspect-[16/12] w-full", className)}>
      <BrowserFrame study={study} progress={web} className="absolute left-0 top-[6%] w-[84%]" />
      <PhoneFrame study={study} progress={phone} className="absolute bottom-[2%] right-0 w-[27%]" />
    </div>
  );
}
