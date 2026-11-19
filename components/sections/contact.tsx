import { BriefWizard } from "@/components/contact/brief-wizard";
import { OfficesBand } from "@/components/contact/offices-band";
import { Reveal } from "@/components/motion/primitives";
import { Container, Eyebrow } from "@/components/ui/container";
import { getOffices, getSettings } from "@/lib/server/store";

export async function ContactSection() {
  const [offices, settings] = await Promise.all([getOffices(), getSettings()]);

  return (
    <section className="relative isolate z-20">
      <div aria-hidden className="absolute inset-0 -z-20 bg-surface-muted" />

      <Container id="contact" className="scroll-mt-24 pt-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow center>Contact us</Eyebrow>
          <h2 className="mt-5 text-display-3">
            Let&apos;s build <span className="text-gradient-primary">together</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-body-md text-gray-500">
            Six quick questions, about two minutes. Watch your project take shape as you go, and we&apos;ll come back
            with a plan {settings.responseTime.toLowerCase()}.
          </p>
        </Reveal>

        <div className="mt-14 lg:mt-16">
          <BriefWizard responseTime={settings.responseTime} />
        </div>

      </Container>

      {/* Offices: night-side planet, boarding passes, departures board — runs into the footer */}
      <OfficesBand offices={offices} settings={settings} />
    </section>
  );
}
