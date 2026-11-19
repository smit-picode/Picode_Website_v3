import { cn } from "@/lib/utils";

/**
 * Country code chip. Used instead of flag emoji, which Windows does not
 * render (it shows bare letters like "IN"), so it looks the same everywhere.
 */
export function CountryBadge({ code, className }: { code: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded-md bg-gradient-primary px-1 font-display text-[0.625rem] font-bold uppercase tracking-wider text-white",
        className,
      )}
    >
      {code}
    </span>
  );
}
