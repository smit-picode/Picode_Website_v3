import { SmartVideo } from "@/components/ui/smart-video";
import type { Clip } from "@/lib/content/media";
import { cn } from "@/lib/utils";

/** A phone-shaped frame for the portrait clips. */
export function PhoneFrame({ clip, className }: { clip: Clip; className?: string }) {
  return (
    <figure
      className={cn(
        "relative aspect-[9/19] w-[13.5rem] shrink-0 rounded-[2.4rem] border border-white/10 bg-[#05080f] p-2 shadow-float ring-1 ring-black/5 sm:w-[15rem]",
        className,
      )}
    >
      <div className="relative size-full overflow-hidden rounded-[1.9rem] bg-black">
        <SmartVideo clip={clip} />
        {/* Notch + glass sheen */}
        <span aria-hidden className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-black/90" />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      </div>
      <figcaption className="sr-only">{clip.alt}</figcaption>
    </figure>
  );
}

/**
 * Wide banner for a case study: the clip plays sharp at its native shape in
 * the centre, while a blurred, brand-tinted copy of its still fills the rest,
 * so square or 16:9 clips never get cropped or stretched across a 2:1 banner.
 */
export function CaseHeroVideo({
  clip,
  palette,
  label,
  stat,
  className,
}: {
  clip: Clip;
  palette: [string, string];
  label: string;
  stat?: { value: string; label: string };
  className?: string;
}) {
  const [a, b] = palette;
  return (
    <figure className={cn("relative isolate overflow-hidden bg-[#050912]", className)}>
      {/* Ambient backdrop: the same footage, blurred and tinted */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={clip.poster} alt="" aria-hidden className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-60 blur-3xl saturate-150" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(60% 80% at 10% 10%, ${a}55, transparent 70%), radial-gradient(60% 80% at 90% 90%, ${b}55, transparent 70%), linear-gradient(to bottom, #05091233, #050912aa)`,
        }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />

      {/* The clip itself, uncropped */}
      <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-10 lg:p-12">
        <div
          className="relative h-full max-w-full overflow-hidden rounded-2xl bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/15"
          style={{ aspectRatio: clip.ratio }}
        >
          <SmartVideo clip={clip} />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        </div>
      </div>

      {/* HUD overlays */}
      <figcaption className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-white ring-1 ring-white/10 backdrop-blur sm:bottom-6 sm:left-6">
        <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
        {label}
        <span className="sr-only">: {clip.alt}</span>
      </figcaption>
      {stat && (
        <div className="absolute right-4 top-4 hidden rounded-2xl bg-black/45 px-4 py-3 text-right text-white ring-1 ring-white/10 backdrop-blur sm:right-6 sm:top-6 sm:block">
          <p className="font-display text-2xl font-semibold leading-none">{stat.value}</p>
          <p className="mt-1 text-xs text-white/70">{stat.label}</p>
        </div>
      )}
    </figure>
  );
}

/** A rounded media panel with a HUD caption, for wide placements. */
export function VideoPanel({ clip, caption, className }: { clip: Clip; caption?: string; className?: string }) {
  return (
    <figure className={cn("hud-frame relative overflow-hidden rounded-3xl border border-gray-200/70 bg-black shadow-float", className)}>
      <SmartVideo clip={clip} className="absolute inset-0" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {caption && (
        <figcaption className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-white backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          {caption}
        </figcaption>
      )}
      <span className="sr-only">{clip.alt}</span>
    </figure>
  );
}
