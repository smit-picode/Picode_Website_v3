import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Tilt } from "@/components/motion/primitives";
import { SampleBadge } from "@/components/ui/section";
import { SmartVideo } from "@/components/ui/smart-video";
import { acceleratorStatus, type Accelerator } from "@/lib/content/company";
import { caseClips } from "@/lib/content/media";
import { getOffering } from "@/lib/content/offerings";
import type { CaseStudy } from "@/lib/content/work";
import { cn } from "@/lib/utils";

/** Generated cover art for a case study: gradient mesh + abstract UI wireframe. */
export function CaseCover({ cs, className }: { cs: CaseStudy; className?: string }) {
  const [a, b] = cs.palette;
  const id = `cc-${cs.slug}`;
  return (
    <div className={cn("relative overflow-hidden bg-dark", className)}>
      <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <radialGradient id={`${id}-a`} cx="20%" cy="20%" r="70%">
            <stop offset="0" stopColor={a} stopOpacity="0.85" />
            <stop offset="1" stopColor={a} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-b`} cx="90%" cy="90%" r="70%">
            <stop offset="0" stopColor={b} stopOpacity="0.8" />
            <stop offset="1" stopColor={b} stopOpacity="0" />
          </radialGradient>
          <pattern id={`${id}-grid`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="white" strokeOpacity="0.06" />
          </pattern>
        </defs>
        <rect width="640" height="400" fill="#050912" />
        <rect width="640" height="400" fill={`url(#${id}-a)`} />
        <rect width="640" height="400" fill={`url(#${id}-b)`} />
        <rect width="640" height="400" fill={`url(#${id}-grid)`} />
        {/* Wireframe app window */}
        <g transform="translate(150 70) rotate(-4)" opacity="0.95">
          <rect width="360" height="240" rx="14" fill="#0B1220" fillOpacity="0.75" stroke="white" strokeOpacity="0.15" />
          <circle cx="18" cy="16" r="4" fill="white" fillOpacity="0.25" />
          <circle cx="32" cy="16" r="4" fill="white" fillOpacity="0.25" />
          <circle cx="46" cy="16" r="4" fill="white" fillOpacity="0.25" />
          <rect x="16" y="40" width="80" height="184" rx="8" fill="white" fillOpacity="0.05" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="26" y={54 + i * 22} width={i === 1 ? 60 : 48} height="8" rx="4" fill={i === 1 ? a : "white"} fillOpacity={i === 1 ? 0.9 : 0.15} />
          ))}
          <rect x="110" y="40" width="234" height="90" rx="8" fill="white" fillOpacity="0.05" />
          <path d="M120 115 C150 100 170 110 200 85 S260 70 290 62 S330 55 336 52" fill="none" stroke={b} strokeWidth="3" strokeLinecap="round" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={110 + i * 80} y="142" width="72" height="82" rx="8" fill="white" fillOpacity="0.05" />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={120 + i * 80} y={200 - (i + 1) * 14} width="12" height={(i + 1) * 14 + 14} rx="3" fill={a} fillOpacity="0.8" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function CaseStudyCard({
  cs,
  featured = false,
  wide = false,
}: {
  cs: CaseStudy;
  featured?: boolean;
  /**
   * Full-width featured card (Work page): on desktop the video sits beside the
   * details at full card height instead of squashing into a thin banner.
   * Only meaningful together with `featured`.
   */
  wide?: boolean;
}) {
  const offering = getOffering(cs.offering);
  const clip = caseClips[cs.slug];
  const split = featured && wide;
  return (
    <Link href={`/work/${cs.slug}`} className="group block h-full">
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200/70 bg-surface transition-[border-color,box-shadow] duration-500 hover:border-secondary/40 hover:shadow-float",
          split && "lg:flex-row",
        )}
      >
        {/* Featured: on desktop the cover grows to absorb the extra height the
            card gets from spanning two rows, so no empty gap opens up.
            Split (wide): video left at full card height, details right. */}
        <div
          className={cn(
            "relative overflow-hidden bg-dark",
            featured && !split && "aspect-[16/10] lg:aspect-auto lg:min-h-[18rem] lg:flex-1",
            split && "aspect-video lg:aspect-auto lg:min-h-[26rem] lg:w-[54%] lg:shrink-0",
          )}
        >
          {clip ? (
            // Cards with a clip show only the video (no still/cover art).
            !featured && <div aria-hidden className="aspect-[16/10]" />
          ) : (
            <CaseCover
              cs={cs}
              className={cn(
                "transition-transform duration-700 ease-smooth group-hover:scale-[1.04]",
                featured ? "absolute inset-0 size-full" : "aspect-[16/10]",
              )}
            />
          )}
          {clip && (
            <>
              {/* Video plays automatically when the card scrolls into view */}
              <SmartVideo
                clip={clip}
                poster={false}
                className="absolute inset-0 transition-transform duration-700 ease-smooth group-hover:scale-[1.04]"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-white backdrop-blur">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden /> In action
              </span>
            </>
          )}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/40 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-white backdrop-blur">{cs.industry}</span>
            {cs.sample && <SampleBadge />}
          </div>
          <span className="absolute bottom-4 right-4 inline-flex size-11 translate-y-2 items-center justify-center rounded-full bg-white text-gray-950 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-white dark:text-[#03060C]">
            <ArrowUpRight className="size-5" aria-hidden />
          </span>
        </div>
        <div className={cn("flex flex-1 flex-col p-6 sm:p-8", featured && !split && "lg:flex-none", split && "lg:p-10")}>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-secondary-strong">
            {offering?.shortTitle} · {cs.client}
          </p>
          <h3 className={cn("mt-3 font-display font-semibold leading-snug tracking-tight", featured ? "text-2xl sm:text-3xl" : "text-xl")}>{cs.title}</h3>
          <p className="mt-3 text-body-sm text-gray-500">{cs.summary}</p>
          {featured && (
            // The featured card spans two rows beside the others: give it the
            // story's substance instead of empty space.
            <div className="mb-8 mt-6 space-y-6">
              <div className="rounded-2xl border border-gray-200/70 bg-surface-muted/60 p-4">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-gray-400">The challenge</p>
                <p className="mt-2 line-clamp-3 text-body-sm text-gray-600">{cs.problem}</p>
              </div>
              <div>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-gray-400">What we built</p>
                <ul className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  {cs.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-gray-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                {cs.stack.map((s) => (
                  <span key={s} className="rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[0.6875rem] text-gray-600">{s}</span>
                ))}
              </div>
            </div>
          )}
          <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-gray-100 pt-6">
            {cs.results.map((r) => (
              <div key={r.label}>
                <dt className="sr-only">{r.label}</dt>
                <dd className="font-display text-xl font-semibold text-gradient-primary sm:text-2xl">{r.value}</dd>
                <dd className="mt-1 text-[0.75rem] leading-snug text-gray-500">{r.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </article>
    </Link>
  );
}

export function AcceleratorCard({ a, detailed = false }: { a: Accelerator; detailed?: boolean }) {
  const status = acceleratorStatus[a.status];
  return (
    <Tilt max={7} glare className="group h-full rounded-3xl">
      <div className="glow-border h-full rounded-3xl">
        <article className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface p-7 sm:p-8">
          <div aria-hidden className="absolute inset-0 bg-blueprint opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-tertiary/20 text-secondary ring-1 ring-inset ring-secondary/30" style={{ transform: "translateZ(30px)" }}>
              <a.icon className="size-7" strokeWidth={1.5} aria-hidden />
            </span>
            <span className={cn("rounded-full px-2.5 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-wider ring-1 ring-inset", status.className)}>
              {status.label}
            </span>
          </div>
          <h3 className="relative mt-7 font-display text-xl font-semibold tracking-tight">{a.name}</h3>
          <p className="relative mt-2 text-sm font-medium text-gray-700">{a.tagline}</p>
          <p className="relative mt-3 text-body-sm text-gray-500">{a.description}</p>
          {detailed && (
            <ul className="relative mt-6 space-y-2.5">
              {a.components.map((c) => (
                <li key={c} className="flex gap-2.5 text-sm text-gray-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          )}
          <p className="relative mt-auto pt-7 font-mono text-xs text-secondary-strong">→ {a.speedup}</p>
        </article>
      </div>
    </Tilt>
  );
}
