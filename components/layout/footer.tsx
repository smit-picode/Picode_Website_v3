import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { BackToTop, FooterWordmark } from "@/components/layout/footer-extras";
import { Container } from "@/components/ui/container";
import { CountryBadge } from "@/components/ui/country-badge";
import { getOffices, getSettings } from "@/lib/server/store";
import { footerNav } from "@/lib/site";

export async function Footer() {
  const [offices, settings] = await Promise.all([getOffices(), getSettings()]);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-dark-900 text-[rgb(148_157_171)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 bg-glow-brand opacity-25"
      />
      {/* brand hairline along the top edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--color-primary)/0.7),rgb(var(--color-secondary)/0.7),transparent)]"
      />

      <Container className="relative pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo className="h-10" />
            <p className="mt-6 max-w-sm text-body-sm">
              An AI-native software engineering company. We design, build and scale digital
              products that accelerate your growth.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <a
                href={`mailto:${settings.generalEmail}`}
                className="flex items-center gap-3 transition-colors hover:text-white"
              >
                <Mail className="size-4 text-primary" aria-hidden />
                {settings.generalEmail}
              </a>
              <a
                href={`mailto:${settings.salesEmail}`}
                className="flex items-center gap-3 transition-colors hover:text-white"
              >
                <Mail className="size-4 text-primary" aria-hidden />
                {settings.salesEmail}
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6875rem]">Sales</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="link-underline text-sm transition-colors duration-300 hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">
                Offices
              </h3>
              <ul className="mt-5 space-y-5">
                {offices.map((office) => (
                  <li key={office.id} className="text-sm">
                    <p className="flex items-center gap-2 font-display font-medium text-white">
                      <CountryBadge code={office.countryCode} />
                      {office.city}, {office.country}
                    </p>
                    <a
                      href={`tel:${office.phone.replace(/[^\d+]/g, "")}`}
                      className="mt-1.5 flex items-center gap-2 transition-colors hover:text-white"
                    >
                      <Phone className="size-3.5 text-primary" aria-hidden />
                      {office.phone}
                    </a>
                  </li>
                ))}
              </ul>
              <Link
                href="/#contact"
                className="group mt-6 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-gradient-primary"
              >
                Start a project
                <ArrowUpRight
                  className="size-4 text-secondary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center">
          <p>© {year} Picode. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="link-underline transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="link-underline transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="/sitemap" className="link-underline transition-colors hover:text-white">
              Sitemap
            </Link>
            <BackToTop />
          </div>
        </div>
      </Container>
      <FooterWordmark />
    </footer>
  );
}
