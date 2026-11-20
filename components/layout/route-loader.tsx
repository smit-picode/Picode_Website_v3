"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import logoColored from "@/logo/picode-logo-colored-symbol.svg";

/** Wait this long before showing, so instant navigations never flash the overlay. */
const SHOW_AFTER_MS = 150;
/** Safety net: never leave the overlay up if a navigation silently doesn't happen. */
const GIVE_UP_MS = 12_000;

/** Start the loader from code (e.g. before `router.push`). */
export function startRouteLoader() {
  window.dispatchEvent(new Event("picode:navigate"));
}

/**
 * Full-screen loader for page navigations: a dimmed, blurred overlay with the Picode
 * mark filling up with the brand gradient. Shown when an internal link (or
 * startRouteLoader) starts a navigation that takes more than a moment; hidden as soon
 * as the new route renders.
 */
export function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <RouteLoaderInner />
    </Suspense>
  );
}

function RouteLoaderInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef(0);
  const giveUpTimer = useRef(0);

  const stop = () => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(giveUpTimer.current);
    setVisible(false);
  };

  // New route rendered → done.
  useEffect(() => {
    stop();
  }, [pathname, search]);

  useEffect(() => {
    const begin = () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(giveUpTimer.current);
      showTimer.current = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
      giveUpTimer.current = window.setTimeout(stop, GIVE_UP_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab / window
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.hasAttribute("download")) return;
      const target = a.getAttribute("target");
      if (target && target !== "_self") return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // mailto:, tel:, other sites
      // Same page (only the #hash differs) → just a scroll, no loader.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      // Files and API routes aren't page navigations.
      if (url.pathname.startsWith("/api/") || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      begin();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("picode:navigate", begin);
    // Back/forward can also wait on the server.
    window.addEventListener("popstate", begin);
    // Full page loads (e.g. window.location.assign) never fire a route change here.
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("picode:navigate", begin);
      window.removeEventListener("popstate", begin);
      window.removeEventListener("pagehide", stop);
      window.clearTimeout(showTimer.current);
      window.clearTimeout(giveUpTimer.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="route-loader"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-md"
        >
          <span className="sr-only">Loading page…</span>
          <LogoFill />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The mark as an empty silhouette, with the coloured mark rising inside it like liquid.
 * Both layers use the same file (picode-logo-colored-symbol.svg): the plain
 * picode-logo-symbol.svg is drawn at a slightly different size/offset, so it can't be
 * overlaid exactly. The silhouette is tinted navy (light) / white (dark) to read as the
 * plain logo.
 */
function LogoFill() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-24 sm:w-28"
      aria-hidden
    >
      {/* empty state: same mark, as a flat silhouette */}
      <Image
        src={logoColored}
        alt=""
        priority
        className="block h-auto w-full opacity-40 [filter:brightness(0)] dark:opacity-25 dark:[filter:brightness(0)_invert(1)]"
      />

      {/* fill: the coloured symbol revealed from the bottom up, on a loop */}
      <motion.div
        className="absolute inset-0"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={
          reduce
            ? { clipPath: "inset(0% 0 0 0)", opacity: [0.55, 1, 0.55] }
            : { clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)", "inset(0% 0 0 0)", "inset(0% 0 100% 0)"] }
        }
        transition={
          reduce
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 2, times: [0, 0.55, 0.75, 1], repeat: Infinity, ease: "easeInOut" }
        }
      >
        <Image src={logoColored} alt="" priority className="block h-auto w-full" />
      </motion.div>
    </motion.div>
  );
}
