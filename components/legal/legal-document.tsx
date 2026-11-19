import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, CalendarDays, Clock, FileText, Mail, Shield } from "lucide-react";
import { LegalToc } from "@/components/legal/legal-toc";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/section";
import type { LegalBlock, LegalDocument } from "@/lib/content/legal";

type Props = {
  doc: LegalDocument;
  email: string;
  address: string;
  /** The companion document, linked from the hero. */
  related: { label: string; href: string };
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function readingMinutes(doc: LegalDocument) {
  const text = doc.sections.flatMap((s) => s.body.map((b) => (typeof b === "string" ? b : b.list.join(" ")))).join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}

/** Replaces {email} / {address} tokens with a link / the office address. */
function renderText(text: string, email: string, address: string): ReactNode[] {
  return text.split(/(\{email\}|\{address\})/).map((part, i) => {
    if (part === "{email}")
      return (
        <a key={i} href={`mailto:${email}`} className="font-medium text-primary-strong underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary">
          {email}
        </a>
      );
    if (part === "{address}") return <span key={i}>{address}</span>;
    return part;
  });
}

function Block({ block, email, address }: { block: LegalBlock; email: string; address: string }) {
  if (typeof block === "string") return <p>{renderText(block, email, address)}</p>;
  return (
    <ul className="space-y-2.5">
      {block.list.map((item) => (
        <li key={item} className="relative pl-6">
          <span aria-hidden className="absolute left-0 top-[0.7em] size-1.5 -translate-y-1/2 rounded-full bg-gradient-primary" />
          {renderText(item, email, address)}
        </li>
      ))}
    </ul>
  );
}

/** Shared layout for /privacy and /terms: hero, highlights, sticky contents and the full text. */
export function LegalDocumentView({ doc, email, address, related }: Props) {
  const Icon = doc.title.startsWith("Privacy") ? Shield : FileText;

  return (
    <>
      <PageHero eyebrow={doc.eyebrow} title={doc.title} description={doc.summary}>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 text-secondary-strong" aria-hidden />
            Last updated <time dateTime={doc.updated} className="font-medium text-gray-700">{formatDate(doc.updated)}</time>
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="size-4 text-secondary-strong" aria-hidden />
            {readingMinutes(doc)} min read
          </span>
          <Link href={related.href} className="group inline-flex items-center gap-1.5 font-medium text-gray-700 transition-colors hover:text-primary-strong">
            {related.label}
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </PageHero>

      <section className="pb-24 pt-14 lg:pb-32 lg:pt-20">
        <Container>
          {/* At a glance */}
          <div className="grid gap-4 sm:grid-cols-3">
            {doc.highlights.map((h) => (
              <div key={h.title} className="rounded-2xl border border-gray-200/70 bg-surface p-5 shadow-soft">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary-soft text-primary-strong ring-1 ring-inset ring-primary/15">
                  <Icon className="size-4" aria-hidden />
                </span>
                <p className="mt-4 font-display font-semibold text-gray-900">{h.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{h.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
              <div className="sticky top-28">
                <LegalToc items={doc.sections.map(({ id, title }) => ({ id, title }))} />
              </div>
            </aside>

            <article className="max-w-3xl lg:col-span-8 xl:col-span-9">
              {doc.sections.map((section, i) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-gray-200/70 py-10 first:border-t-0 first:pt-0">
                  <h2 className="flex items-baseline gap-4 font-display text-xl font-semibold text-gray-900 sm:text-2xl">
                    <span className="font-mono text-sm font-normal tabular-nums text-secondary-strong">{String(i + 1).padStart(2, "0")}</span>
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-4 text-[0.9375rem] leading-relaxed text-gray-600 sm:pl-10">
                    {section.body.map((block, j) => (
                      <Block key={j} block={block} email={email} address={address} />
                    ))}
                  </div>
                </section>
              ))}

              {/* Questions */}
              <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-3xl border border-gray-200/70 bg-gradient-primary-soft p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="font-display font-semibold">Questions about this {doc.title.startsWith("Privacy") ? "policy" : "page"}?</p>
                  <p className="mt-1 text-sm text-gray-500">Write to us and a real person will reply, usually within one business day.</p>
                </div>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  <Mail className="size-4" aria-hidden /> {email}
                </a>
              </div>
            </article>
          </div>
        </Container>
      </section>
    </>
  );
}
