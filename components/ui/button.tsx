"use client";

import Link from "next/link";
import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

export type ButtonVariant = "primary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-semibold tracking-wide " +
  "transition-[background-color,background-position,box-shadow,color,border-color] duration-300 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-primary-animated text-white shadow-[0_8px_24px_-12px_rgb(var(--color-primary)/0.7)] hover:shadow-glow [text-shadow:0_1px_1px_rgb(13_148_136/0.35)]",
  outline:
    "border border-gray-200 bg-surface text-gray-900 hover:border-gray-300 hover:bg-gray-50",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-900/5 hover:text-gray-900",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

const motionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
} as const;

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = CommonProps &
  Omit<HTMLMotionProps<"button">, keyof CommonProps> & { href?: undefined };

export type ButtonLinkProps = CommonProps &
  Omit<HTMLMotionProps<"a">, keyof CommonProps | "href"> & { href: string };

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

/** Interactive button with tactile Framer Motion feedback. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, leftIcon, rightIcon, className, children, type = "button", ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...motionProps}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </motion.button>
  );
});

/** Same look as <Button>, rendered as a Next.js <Link>. */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant, size, leftIcon, rightIcon, className, children, href, ...props },
  ref,
) {
  return (
    <MotionLink
      ref={ref}
      href={href}
      className={buttonClasses({ variant, size, className })}
      {...motionProps}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </MotionLink>
  );
});
