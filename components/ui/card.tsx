import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Lift + shadow-soft on hover (default true). */
  interactive?: boolean;
};

/**
 * White surface, rounded-2xl, subtle border.
 * Hover lift is pure CSS so cards can render as Server Components.
 */
export function Card({ interactive = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-gray-100 bg-surface p-6 sm:p-8",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-300 ease-smooth hover:-translate-y-2 hover:border-gray-200/70 hover:shadow-soft",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type ServiceCardProps = Omit<CardProps, "title"> & {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  index?: number;
  footer?: ReactNode;
};

/** Icon (top-left) → H3 title → small paragraph, per ui_components.md. */
export function ServiceCard({
  icon: Icon,
  title,
  description,
  index,
  footer,
  className,
  ...props
}: ServiceCardProps) {
  return (
    <Card className={cn("group flex h-full flex-col", className)} {...props}>
      <div className="flex items-start justify-between">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-primary-soft text-primary-strong ring-1 ring-inset ring-primary/15 transition-colors duration-300 group-hover:bg-gradient-primary group-hover:text-white">
          <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden />
        </span>
        {typeof index === "number" && (
          <span className="font-display text-sm font-medium tabular-nums text-gray-300 transition-colors duration-300 group-hover:text-primary-strong">
            {String(index).padStart(2, "0")}
          </span>
        )}
      </div>
      <h3 className="mt-6 text-h3">{title}</h3>
      <p className="mt-3 text-body-sm text-gray-500">{description}</p>
      {footer && <div className="mt-auto pt-6">{footer}</div>}
    </Card>
  );
}
