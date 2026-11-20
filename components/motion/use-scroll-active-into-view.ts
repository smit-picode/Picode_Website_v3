"use client";

import { useEffect, type DependencyList, type RefObject } from "react";

/**
 * Keeps the active item of a horizontally scrolling strip (tabs / chips) in view.
 *
 * When `deps` change (e.g. an autoplaying section moves to the next tab), the strip
 * scrolls sideways so the active item sits in the middle. Only the strip scrolls,
 * never the page, so it can't yank the reader up or down. It does nothing when the
 * strip isn't scrollable (e.g. the vertical tab list on desktop).
 *
 * @param stripRef  the element with `overflow-x: auto`
 * @param selector  how to find the active item inside it
 */
export function useScrollActiveIntoView(
  stripRef: RefObject<HTMLElement>,
  deps: DependencyList,
  selector = '[aria-selected="true"]',
) {
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;
    if (!/(auto|scroll)/.test(getComputedStyle(strip).overflowX)) return; // e.g. desktop layout: not a scroller
    const item = strip.querySelector<HTMLElement>(selector);
    if (!item) return;

    const s = strip.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    const left = strip.scrollLeft + (r.left - s.left) - (s.width - r.width) / 2;
    const max = strip.scrollWidth - strip.clientWidth;
    const target = Math.max(0, Math.min(max, left));
    if (Math.abs(target - strip.scrollLeft) < 2) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: target, behavior: reduce ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
