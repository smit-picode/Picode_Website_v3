import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

import logoFull from "@/logo/picode-logo-colored.svg";
import logoSymbol from "@/logo/picode-logo-colored-symbol.svg";
import logoFullDark from "@/logo/picode-logo.svg";

type LogoProps = {
  /** "full" = symbol + wordmark, "symbol" = mark only. */
  variant?: "full" | "symbol";
  /** "color" = brand gradient, "mono" = navy (for light, non-brand contexts). */
  tone?: "color" | "mono";
  className?: string;
  href?: string | null;
  priority?: boolean;
};

export function Logo({
  variant = "full",
  tone = "color",
  className,
  href = "/",
  priority,
}: LogoProps) {
  const src = variant === "symbol" ? logoSymbol : tone === "mono" ? logoFullDark : logoFull;

  const img = (
    <Image
      src={src}
      alt="Picode"
      priority={priority}
      className={cn(variant === "symbol" ? "h-8 w-auto" : "h-9 w-auto", className)}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} aria-label="Picode — home" className="inline-flex shrink-0 items-center rounded-md">
      {img}
    </Link>
  );
}
