"use client";

import { useEffect } from "react";
import Lenis from "lenis";

let instance: Lenis | null = null;

/** Access the active Lenis instance (e.g. to stop scrolling while a menu is open). */
export function getLenis() {
  return instance;
}

const HEADER_OFFSET = -88;

/**
 * Inertia-based smooth scrolling (Lenis). Native scroll position is kept, so
 * Framer Motion `useScroll`, sticky elements and IntersectionObserver keep working.
 * Disabled for users who prefer reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    instance = lenis;

    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });

    // Smoothly handle in-page anchors like "/#contact" or "#offerings".
    // Runs in the capture phase so it wins over next/link, which would otherwise
    // preventDefault() first and jump straight to the section.
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (!url.hash || url.pathname !== window.location.pathname) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, {
        offset: HEADER_OFFSET,
        duration: 1.6,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      });
      history.replaceState(null, "", url.hash);
    }
    document.addEventListener("click", onClick, true);

    // Arriving on "/#contact" from another page.
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        window.setTimeout(
          () => lenis.scrollTo(target as HTMLElement, { offset: HEADER_OFFSET, immediate: true }),
          50,
        );
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick, true);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return null;
}
