import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { LoginShowcase } from "@/components/admin/login-showcase";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="relative isolate grid min-h-screen bg-surface-muted lg:grid-cols-[1.1fr_1fr]">
      {/* Left: live console preview */}
      <LoginShowcase />

      {/* Right: sign-in */}
      <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-grid-faint bg-[size:44px_44px] opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
        />
        <div aria-hidden className="absolute right-0 top-1/4 -z-10 size-[30rem] bg-glow-secondary opacity-[0.12]" />

        <header className="flex items-center justify-between">
          <Logo className="h-8 lg:hidden" />
          <span className="hidden lg:block" />
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <LoginForm next={searchParams.next} />
        </div>

        <p className="text-center text-xs text-gray-400">
          Protected area · sessions are encrypted and expire automatically
        </p>
      </section>
    </main>
  );
}
