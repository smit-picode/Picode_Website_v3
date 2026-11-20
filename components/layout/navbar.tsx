"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getLenis } from "@/components/motion/smooth-scroll";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    return () => {
      document.body.style.overflow = "";
      getLenis()?.start();
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || open
            ? "border-gray-200/70 bg-background/75 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.15)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <Container className="flex h-[4.5rem] items-center justify-between gap-6">
          <Logo priority className="h-8 sm:h-9" />

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1 rounded-full border border-gray-200/70 bg-surface/60 p-1 backdrop-blur">
              {mainNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative z-10 block rounded-full px-4 py-2 font-display text-sm font-medium transition-colors duration-300",
                        active ? "text-gray-900" : "text-gray-500 hover:text-gray-900",
                      )}
                    >
                      {item.label}
                    </Link>
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-gray-900/[0.06]"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ButtonLink
              href="/contact"
              size="sm"
              className="hidden sm:inline-flex"
              rightIcon={<ArrowUpRight className="size-4" aria-hidden />}
            >
              Let&apos;s Talk
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-surface/80 text-gray-800 transition-colors hover:bg-gray-50 md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
            className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-gray-200/70 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <Container className="py-6">
              <nav aria-label="Mobile">
                <ul className="space-y-1">
                  {mainNav.map((item, i) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive(pathname, item.href) ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg font-medium transition-colors",
                          isActive(pathname, item.href)
                            ? "bg-gray-50 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                      >
                        {item.label}
                        <ArrowUpRight className="size-4 text-gray-400" aria-hidden />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <ButtonLink href="/contact" size="lg" className="mt-6 w-full">
                Let&apos;s Talk
              </ButtonLink>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
