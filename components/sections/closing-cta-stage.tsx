"use client";

import { ArrowRight, Clock, Mail } from "lucide-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { replyWhen } from "@/lib/utils";

/** Homepage closer: a calm, single call to action. */
export function ClosingCtaStage({
  email,
  whatsapp,
  responseTime,
}: {
  email: string;
  whatsapp: string;
  responseTime: string;
}) {
  const wa = whatsapp.replace(/\D/g, "");

  return (
    <section aria-labelledby="closing-cta-title" className="bg-surface-muted pb-24 pt-12 lg:pb-28">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/90 bg-surface px-6 py-12 shadow-soft sm:px-12 lg:px-16 lg:py-14">
          {/* a single quiet brand accent */}
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" />

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <h2 id="closing-cta-title" className="font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                Ready to start your project?
              </h2>
              <p className="mt-3 text-body-md text-gray-500">
                Tell us what you&apos;re building. We&apos;ll come back with a plan, a timeline and an estimate.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact#contact" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Start a project
              </ButtonLink>
              {wa && (
                <a
                  href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi Picode, I'd like to discuss a project.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses({ variant: "outline", size: "lg" })}
                >
                  <WhatsAppIcon className="size-4 text-[#25D366]" />
                  WhatsApp us
                </a>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t border-gray-100 pt-6 text-sm text-gray-500">
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 transition-colors hover:text-gray-900">
                <Mail className="size-4 text-primary-strong" aria-hidden />
                {email}
              </a>
            )}
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4 text-primary-strong" aria-hidden />
              We reply {replyWhen(responseTime)}
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
