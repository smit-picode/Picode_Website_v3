import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Briefcase, Check, Clock, MapPin, Sparkles, Users } from "lucide-react";
import { ApplyForm } from "@/components/careers/apply-form";
import { ButtonLink } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/container";
import { AuroraBackdrop } from "@/components/ui/section";
import { getJob, listJobs } from "@/lib/server/careers";
import { getPublicSettings } from "@/lib/server/store";
import { replyWhen } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

async function load(id: string) {
  if (!/^[a-z0-9-]{1,60}$/.test(id)) return null;
  try {
    return await getJob(id, { publishedOnly: true });
  } catch (error) {
    console.error("[careers] Could not load job:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await load(params.id);
  if (!job) return { title: "Role not found" };
  return {
    title: `${job.title} · Careers`,
    description: `${job.summary} ${job.location} · ${job.employmentType}.`,
  };
}

export default async function JobPage({ params }: Props) {
  const job = await load(params.id);
  if (!job) notFound();
  const [settings, all] = await Promise.all([getPublicSettings(), listJobs({ publishedOnly: true }).catch(() => [])]);
  const others = all.filter((j) => j.id !== job.id).slice(0, 3);

  const facts = [
    { icon: Users, label: "Team", value: job.team },
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Clock, label: "Type", value: job.employmentType },
    ...(job.experience ? [{ icon: Briefcase, label: "Experience", value: job.experience }] : []),
  ];

  return (
    <>
      {/* Header */}
      <section className="noise relative isolate overflow-hidden pb-14 pt-32 sm:pt-36 lg:pb-16">
        <AuroraBackdrop intensity={0.7} />
        <Container>
          <Link href="/careers#openings" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            <ArrowLeft className="size-4" aria-hidden /> All open roles
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <Eyebrow>{job.team}</Eyebrow>
              <h1 className="mt-5 text-display-2 font-semibold">{job.title}</h1>
              <p className="mt-5 max-w-2xl text-body-lg text-gray-500">{job.summary}</p>
            </div>
            <div className="rounded-3xl border border-gray-200/90 bg-surface/90 p-5 shadow-soft backdrop-blur">
              <dl className="grid grid-cols-2 gap-4">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <dt className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Icon className="size-3.5 text-primary-strong" aria-hidden /> {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
              <ButtonLink href="#apply" className="mt-5 w-full" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Apply for this role
              </ButtonLink>
            </div>
          </div>
        </Container>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
      </section>

      {/* Description */}
      <section className="py-16 lg:py-20">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="max-w-3xl space-y-12">
            {job.about && (
              <Block title="About the role">
                <p className="whitespace-pre-line text-body-md leading-relaxed text-gray-600">{job.about}</p>
              </Block>
            )}
            {job.responsibilities.length > 0 && <ListBlock title="What you'll do" items={job.responsibilities} />}
            {job.requirements.length > 0 && <ListBlock title="What we're looking for" items={job.requirements} />}
            {job.niceToHave.length > 0 && <ListBlock title="Nice to have" items={job.niceToHave} muted />}
          </article>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            {job.skills.length > 0 && (
              <div className="rounded-3xl border border-gray-200/90 bg-surface p-6 shadow-soft">
                <h2 className="font-display text-sm font-semibold text-gray-900">Skills for this role</h2>
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.map((s) => (
                    <span key={s} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-strong">
                      {s}
                    </span>
                  ))}
                </p>
              </div>
            )}
            <div className="rounded-3xl border border-gray-200/90 bg-surface p-6 shadow-soft">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-gray-900">
                <Sparkles className="size-4 text-secondary" aria-hidden /> How hiring works
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-gray-600">
                {["Apply in about two minutes", `We reply ${replyWhen(settings.responseTime)}`, "Intro call with the team", "Technical conversation", "Offer"].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-100 font-mono text-[0.625rem] font-semibold text-gray-600">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </Container>
      </section>

      {/* Apply */}
      <section id="apply" className="scroll-mt-24 bg-surface-muted/60 py-20 lg:py-24">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Apply</Eyebrow>
            <h2 className="mt-5 text-display-3">
              Apply for <span className="text-gradient-ai">{job.title}</span>
            </h2>
            <p className="mt-4 text-body-md text-gray-500">Three short steps. Your card on the right fills in as you go.</p>
          </div>
          <div className="mt-10">
            <ApplyForm job={{ id: job.id, title: job.title, skills: job.skills }} responseTime={settings.responseTime} />
          </div>
        </Container>
      </section>

      {others.length > 0 && (
        <section className="py-20">
          <Container>
            <h2 className="font-display text-2xl font-semibold text-gray-900">Other open roles</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/careers/${o.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-gray-200/90 bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <span className="font-mono text-[0.6875rem] uppercase tracking-widest text-secondary-strong">{o.team}</span>
                    <span className="mt-2 font-display text-lg font-semibold text-gray-900 group-hover:text-primary-strong">{o.title}</span>
                    <span className="mt-1 text-sm text-gray-500">
                      {o.location} · {o.employmentType}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-strong">
                      View role <ArrowUpRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-gray-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ListBlock({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <Block title={title}>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it} className="flex gap-3 text-body-md text-gray-600">
            <span
              className={
                muted
                  ? "mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
                  : "mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-strong"
              }
            >
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            {it}
          </li>
        ))}
      </ul>
    </Block>
  );
}
