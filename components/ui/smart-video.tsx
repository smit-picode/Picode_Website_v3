"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Clip } from "@/lib/content/media";

type Props = {
  clip: Clip;
  className?: string;
  /**
   * "inview": plays while on screen, pauses off screen.
   * "hover": plays while the nearest link / [data-video-host] is hovered or focused.
   */
  mode?: "inview" | "hover";
  /** false: no still image. The clip itself loads up front and shows its first frame. */
  poster?: boolean;
};

/**
 * Lightweight decorative video: muted, looping, inline. The MP4 is not
 * requested until it is needed (the poster paints first), it pauses when not
 * visible, and visitors who prefer reduced motion only ever see the poster.
 */
export function SmartVideo({ clip, className, mode = "inview", poster = true }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // React does not apply the `muted` prop when hydrating server HTML, so the
    // element would count as "has sound" and Chrome blocks autoplay. Set it on
    // the element directly: muted videos are always allowed to autoplay.
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");

    let wanted = false; // should be playing right now (in view / hovered)
    const retryEvents = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    const retry = () => {
      retryEvents.forEach((ev) => window.removeEventListener(ev, retry));
      if (wanted) void v.play().catch(() => undefined);
    };
    const play = () => {
      wanted = true;
      if (!v.getAttribute("src")) v.src = clip.src;
      v.play().catch(() => {
        // Autoplay refused (browser policy, an extension, power saving):
        // try again once the data is ready and on the visitor's next gesture.
        v.addEventListener("canplay", () => wanted && void v.play().catch(() => undefined), { once: true });
        retryEvents.forEach((ev) => window.addEventListener(ev, retry, { once: true, passive: true }));
      });
    };
    const pause = () => {
      wanted = false;
      v.pause();
    };
    const cleanupRetry = () => retryEvents.forEach((ev) => window.removeEventListener(ev, retry));

    if (mode === "hover") {
      const host = v.closest<HTMLElement>("a, [data-video-host]") ?? v.parentElement;
      if (!host) return;
      host.addEventListener("pointerenter", play);
      host.addEventListener("pointerleave", pause);
      host.addEventListener("focusin", play);
      host.addEventListener("focusout", pause);
      return () => {
        host.removeEventListener("pointerenter", play);
        host.removeEventListener("pointerleave", pause);
        host.removeEventListener("focusin", play);
        host.removeEventListener("focusout", pause);
        cleanupRetry();
      };
    }

    // Start just before the video scrolls into view, so it is already moving
    // when the visitor reaches it.
    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? play() : pause()),
      { rootMargin: "200px 0px", threshold: 0 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      cleanupRetry();
    };
  }, [clip.src, mode]);

  return (
    <video
      ref={ref}
      poster={poster ? clip.poster : undefined}
      src={poster ? undefined : clip.src}
      muted
      loop
      playsInline
      preload={poster ? "none" : "auto"}
      aria-hidden
      tabIndex={-1}
      className={cn("pointer-events-none size-full object-cover", className)}
    />
  );
}
