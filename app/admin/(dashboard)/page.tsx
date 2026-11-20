import Link from "next/link";
import { ArrowRight, Database, Download, FolderKanban, Inbox, Mail, MailOpen, UserRoundSearch } from "lucide-react";
import { ApplicationsBoard } from "@/components/admin/applications-board";
import { CaseStudiesManager } from "@/components/admin/case-studies-manager";
import { InquiryList } from "@/components/admin/inquiry-list";
import { ServicesEditor } from "@/components/admin/services-editor";
import { SiteSettings } from "@/components/admin/site-settings";
import { JobsManager } from "@/components/admin/jobs-manager";
import { OfficesManager } from "@/components/admin/offices-manager";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/server/auth";
import { listApplications, listJobs } from "@/lib/server/careers";
import { formatDate } from "@/lib/format";
import { getServicesContent, servicesContentIsCustom } from "@/lib/server/site-content";
import { mailStatus } from "@/lib/server/mail-config";
import { getCaseStudies, getOffices, getPreferences, getSettings, getSmtp, listInquiries } from "@/lib/server/store";

type Tab = "overview" | "inquiries" | "jobs" | "applications" | "services" | "case-studies" | "offices" | "settings" | "preferences";

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string; job?: string } }) {
  await requireAdmin();
  const tab: Tab = (["overview", "inquiries", "jobs", "applications", "services", "case-studies", "offices", "settings", "preferences"] as const).includes(searchParams.tab as Tab)
    ? (searchParams.tab as Tab)
    : "overview";

  const [inquiries, offices, settings, caseStudies, preferences] = await Promise.all([
    listInquiries(),
    getOffices(),
    getSettings(),
    getCaseStudies(),
    getPreferences(),
  ]);

  if (tab === "inquiries") {
    return (
      <>
        <PageTitle
          title="Inquiries"
          subtitle="Messages submitted through the website contact form."
          action={
            <a
              href="/admin/export"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-surface px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          }
        />
        <InquiryList inquiries={inquiries} preferences={preferences} />
      </>
    );
  }

  if (tab === "jobs" || tab === "applications") {
    const careers = await loadCareers();
    if (!careers) return <CareersUnavailable />;
    const { jobs, applications } = careers;
    if (tab === "jobs") {
      const counts: Record<string, number> = {};
      for (const a of applications) if (a.jobId) counts[a.jobId] = (counts[a.jobId] ?? 0) + 1;
      return (
        <>
          <PageTitle title="Job posts" subtitle="Roles shown on the careers page. Each post gets its own page with an apply form." />
          <JobsManager jobs={jobs} applicationCounts={counts} />
        </>
      );
    }
    return (
      <>
        <PageTitle
          title="Applications"
          subtitle="Job applications and talent-pool resumes. Filter by skills, languages, location and experience."
        />
        <ApplicationsBoard applications={applications} jobs={jobs} initialJob={searchParams.job} preferences={preferences} />
      </>
    );
  }

  if (tab === "services") {
    const isCustom = await servicesContentIsCustom().catch(() => null);
    if (isCustom === null) return <CareersUnavailable />;
    const content = await getServicesContent();
    return (
      <>
        <PageTitle title="Services page" subtitle="Services, industries, engagement models and FAQs shown on /services." />
        <ServicesEditor initial={content} isCustom={isCustom} />
      </>
    );
  }

  if (tab === "preferences") {
    const stored = await getSmtp();
    const smtpView = stored ? (({ passwordSealed, ...rest }) => ({ ...rest, hasPassword: Boolean(passwordSealed) }))(stored) : null;
    return (
      <>
        <PageTitle title="Settings" subtitle="Date & time formats, email (SMTP), and exporting or importing the website's data." />
        <SiteSettings preferences={preferences} smtp={smtpView} mailStatus={await mailStatus()} />
      </>
    );
  }

  if (tab === "case-studies") {
    return (
      <>
        <PageTitle
          title="Case studies"
          subtitle="Projects shown in the Case Studies section of the home page: copy, screenshots and logos."
        />
        <CaseStudiesManager studies={caseStudies} />
      </>
    );
  }

  if (tab === "offices") {
    return (
      <>
        <PageTitle title="Offices" subtitle="Addresses, phone numbers and emails shown on the website (contact section, footer & map)." />
        <OfficesManager offices={offices} />
      </>
    );
  }

  if (tab === "settings") {
    return (
      <>
        <PageTitle title="Contact settings" subtitle="Company-wide email addresses and response time shown on the website." />
        <SettingsForm settings={settings} />
      </>
    );
  }

  // Overview
  const overviewApplications = (await listApplications().catch(() => [])).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stats = [
    { label: "Total inquiries", value: inquiries.length, icon: Inbox },
    { label: "Unread", value: inquiries.filter((q) => q.status === "new").length, icon: Mail },
    { label: "Last 7 days", value: inquiries.filter((q) => Date.parse(q.receivedAt) > weekAgo).length, icon: MailOpen },
    { label: "Case studies", value: caseStudies.filter((c) => c.published).length, icon: FolderKanban },
    { label: "Job applications", value: overviewApplications, icon: UserRoundSearch },
  ];

  return (
    <>
      <PageTitle title="Overview" subtitle="A quick look at what's happening on the website." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{label}</p>
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-primary-soft text-primary-strong">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">Latest inquiries</h2>
            <Link href="/admin?tab=inquiries" className="inline-flex items-center gap-1 text-sm font-medium text-primary-strong hover:underline">
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {inquiries.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
              No inquiries yet. Submissions from the website contact form will appear here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {inquiries.slice(0, 5).map((q) => (
                <li key={q.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`mt-2 size-2 shrink-0 rounded-full ${q.status === "new" ? "bg-primary" : "bg-gray-200"}`}
                    aria-label={q.status === "new" ? "Unread" : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold text-gray-900">{q.name}</span>
                      <span className="text-gray-500">{q.company || q.email}</span>
                    </p>
                    <p className="truncate text-sm text-gray-500">{q.message}</p>
                  </div>
                  <time className="shrink-0 text-xs text-gray-400" dateTime={q.receivedAt}>
                    {formatDate(q.receivedAt, preferences.dateFormat)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">Offices</h2>
            <Link href="/admin?tab=offices" className="inline-flex items-center gap-1 text-sm font-medium text-primary-strong hover:underline">
              Manage <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {offices.map((o) => (
              <li key={o.id} className="text-sm">
                <p className="font-semibold text-gray-900">
                  {o.city}, {o.country} {o.isHeadquarters && <span className="ml-1 text-xs font-medium text-primary-strong">HQ</span>}
                </p>
                <p className="text-gray-500">{o.phone}</p>
                <p className="text-gray-500">{o.email}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-gray-100 pt-4 text-sm">
            <p className="text-gray-500">General email</p>
            <p className="font-medium text-gray-900">
              {settings.generalEmail || "—"}
              {settings.generalEmail && !settings.show.generalEmail && <span className="ml-2 text-xs font-normal text-gray-400">(hidden)</span>}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

function PageTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-h1">{title}</h1>
        <p className="mt-1 text-body-sm text-gray-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

async function loadCareers() {
  try {
    const [jobs, applications] = await Promise.all([listJobs(), listApplications()]);
    return { jobs, applications };
  } catch (error) {
    console.error("[admin] Careers data unavailable:", error);
    return null;
  }
}

function CareersUnavailable() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-surface p-10 text-center">
      <Database className="mx-auto size-8 text-gray-300" aria-hidden />
      <p className="mt-3 font-semibold text-gray-900">The database isn&apos;t reachable</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
        Jobs, applications and the services page are stored in PostgreSQL. Check that DATABASE_URL is set and the database is running, then reload.
      </p>
    </div>
  );
}
