"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/** Animated light/dark switch. Reveals the new theme with a circular view transition. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next = isDark ? "light" : "dark";
    const root = document.documentElement;
    const apply = () => {
      // Swap the whole page in one step (no per-element colour fades, which
      // left gradients, glass and the WebGL canvas out of sync mid-switch).
      root.classList.remove("light", "dark");
      root.classList.add(next);
      root.style.colorScheme = next;
      flushSync(() => setTheme(next));
    };

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) {
      apply();
      return;
    }

    // Circular reveal of the new theme, growing out of the toggle.
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = doc.startViewTransition(apply);
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {
        /* transition skipped; theme is already applied */
      });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative inline-flex h-10 w-[4.25rem] shrink-0 items-center rounded-full border border-gray-200 bg-surface/80 p-1 backdrop-blur transition-colors hover:border-gray-300",
        className,
      )}
    >
      {/* Track icons */}
      <Sun className="absolute left-[0.6rem] size-4 text-gray-400" aria-hidden />
      <Moon className="absolute right-[0.6rem] size-4 text-gray-400" aria-hidden />
      {/* Thumb */}
      <motion.span
        className="relative z-10 inline-flex size-8 items-center justify-center rounded-full bg-gradient-primary text-white shadow-glow"
        initial={false}
        animate={{ x: isDark ? 26 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
