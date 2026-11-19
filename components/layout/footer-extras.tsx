"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { getLenis } from "@/components/motion/smooth-scroll";

/** Oversized "picode" wordmark that fills with the brand gradient as the footer scrolls into view. */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const clip = useTransform(scrollYProgress, [0.15, 1], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none relative mt-14 select-none overflow-hidden">
      <motion.div style={reduce ? undefined : { y }} className="relative">
        {/* brand gradient fill, revealed left → right as the footer arrives */}
        <motion.p
          className="whitespace-nowrap bg-gradient-to-b from-[rgb(45_212_191/0.24)] to-[rgb(56_189_248/0.02)] bg-clip-text text-center font-display text-[clamp(5rem,21vw,19rem)] font-bold leading-[0.8] tracking-[-0.06em] text-transparent"
          style={{ clipPath: reduce ? undefined : clip }}
        >
          picode
        </motion.p>
      </motion.div>
    </div>
  );
}

/** Smooth scroll back to the top of the page. */
export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 1.8 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="group inline-flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 transition-colors hover:border-primary/50 hover:text-white"
    >
      Back to top
      <ArrowUp className="size-3.5 text-primary transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden />
    </button>
  );
}
