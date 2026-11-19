import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** max-w-7xl container with the responsive gutters from the layout spec. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

/**
 * Section title shown above a section's headline: a plain typographic label with a short
 * brand rule (on both sides when the heading is centred). Deliberately not a pill/badge.
 */
export function Eyebrow({
  className,
  children,
  center = false,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { center?: boolean }) {
  const rule = <span className="h-[2px] w-8 shrink-0 rounded-full bg-gradient-primary sm:w-10" aria-hidden />;
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-display text-base font-semibold tracking-tight text-primary-strong sm:text-lg",
        center && "justify-center",
        className,
      )}
      {...props}
    >
      {rule}
      {children}
      {center && <span className="h-[2px] w-8 shrink-0 rounded-full bg-gradient-to-l from-primary to-secondary sm:w-10" aria-hidden />}
    </p>
  );
}
