"use client";

import { useEffect, useState } from "react";
import { getLenis } from "@/components/motion/smooth-scroll";
import { cn } from "@/lib/utils";

/** Offset for the fixed navbar when jumping to a section. */
const HEADER_OFFSET = 112;

/** Sticky contents list that highlights the section currently in view. */
export function LegalToc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A band near the top of the viewport: the section crossing it is "current".
      { rootMargin: `-${HEADER_OFFSET}px 0px -60% 0px` },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const jump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -HEADER_OFFSET });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  };

  return (
    <nav aria-label="On this page">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-gray-400">On this page</p>
      <ol className="mt-4 space-y-0.5 border-l border-gray-200">
        {items.map((item, i) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => jump(e, item.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ml-px flex gap-3 border-l-2 py-1.5 pl-4 text-sm transition-colors",
                  isActive
                    ? "border-primary font-medium text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900",
                )}
              >
                <span className={cn("font-mono text-xs tabular-nums", isActive ? "text-primary-strong" : "text-gray-400")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
