"use client";

import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormState } from "react-dom";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, FileJson, Loader2, Mail, Send, Upload, X } from "lucide-react";
import { savePreferencesAction, saveSmtpAction, sendTestEmailAction, type FormState } from "@/app/admin/actions";
import { SavedToast, SaveButton } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MailStatus, SmtpView } from "@/lib/content/mail";
import { DATE_FORMATS, formatDate, formatTime, TIME_FORMATS, type Preferences } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Mirrors SECTIONS / SECTION_LABEL in lib/server/site-data.ts (server-only module). */
const SECTIONS = [
  ["settings", "Contact settings & preferences"],
  ["offices", "Offices"],
  ["caseStudies", "Case studies"],
  ["inquiries", "Inquiries"],
  ["jobs", "Job posts"],
  ["applications", "Job applications"],
  ["services", "Services page"],
] as const;
type Section = (typeof SECTIONS)[number][0];

const SAMPLE = new Date(2026, 10, 19, 14, 5);

export function SiteSettings({ preferences, smtp, mailStatus }: { preferences: Preferences; smtp: SmtpView | null; mailStatus: MailStatus }) {
  return (
    <div className="grid max-w-4xl gap-6">
      <FormatsCard preferences={preferences} />
      <EmailCard smtp={smtp} status={mailStatus} />
      <ExportCard />
      <ImportCard />
    </div>
  );
}

function Card({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary-soft text-primary-strong">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Date & time                                                          */
/* ------------------------------------------------------------------ */

function FormatsCard({ preferences }: { preferences: Preferences }) {
  const [state, action] = useFormState<FormState, FormData>(savePreferencesAction, {});
  const [date, setDate] = useState(preferences.dateFormat);
  const [time, setTime] = useState(preferences.timeFormat);

  return (
    <Card icon={<CalendarClock className="size-5" />} title="Date & time format" subtitle="Used for dates in the admin panel, office clocks on the Contact page and legal pages.">
      <form action={action}>
        <fieldset>
          <legend className="font-display text-sm font-semibold text-gray-800">Date format</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DATE_FORMATS.map((f) => (
              <Choice key={f} name="dateFormat" value={f} checked={date === f} onChange={() => setDate(f)} label={formatDate(SAMPLE, f)} hint={f} />
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="font-display text-sm font-semibold text-gray-800">Time format</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TIME_FORMATS.map((f) => (
              <Choice key={f} name="timeFormat" value={f} checked={time === f} onChange={() => setTime(f)} label={formatTime(SAMPLE, f)} hint={f === "12h" ? "12-hour" : "24-hour"} />
            ))}
          </div>
        </fieldset>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <SaveButton />
          <SavedToast message={state.ok ? state.message : undefined} stamp={state} />
        </div>
      </form>
    </Card>
  );
}

function Choice({ name, value, checked, onChange, label, hint }: { name: string; value: string; checked: boolean; onChange: () => void; label: string; hint: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
        checked ? "border-primary/60 bg-primary/[0.05] ring-2 ring-primary/15" : "border-gray-200 hover:border-gray-300",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-[rgb(var(--color-primary))]" />
      <span>
        <span className="block font-medium text-gray-900">{label}</span>
        <span className="block font-mono text-[0.6875rem] text-gray-400">{hint}</span>
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Email (SMTP)                                                         */
/* ------------------------------------------------------------------ */

const PRESETS = [
  { label: "Gmail / Google Workspace", host: "smtp.gmail.com", port: 465 },
  { label: "Microsoft 365 / Outlook", host: "smtp.office365.com", port: 587 },
  { label: "Zoho", host: "smtp.zoho.com", port: 465 },
  { label: "Mailjet", host: "in-v3.mailjet.com", port: 587 },
  { label: "Brevo", host: "smtp-relay.brevo.com", port: 587 },
] as const;

function EmailCard({ smtp, status }: { smtp: SmtpView | null; status: MailStatus }) {
  const [state, action] = useFormState<FormState, FormData>(saveSmtpAction, {});
  const e = state.fieldErrors ?? {};
  const [enabled, setEnabled] = useState(smtp?.enabled ?? false);
  const [host, setHost] = useState(smtp?.host ?? "");
  const [port, setPort] = useState(String(smtp?.port ?? 587));
  const [clearPw, setClearPw] = useState(false);
  const [testTo, setTestTo] = useState(smtp?.notifyTo.split(",")[0]?.trim() ?? "");
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, startTest] = useTransition();

  const source =
    status.source === "admin"
      ? `These settings (${status.host})`
      : status.source === "env"
        ? `The .env file (${status.host})`
        : "Not configured: notifications are off";

  return (
    <Card icon={<Mail className="size-5" />} title="Email (SMTP)" subtitle="The mail server used for inquiry and job-application notifications.">
      <p className={cn("mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm", status.source === "none" ? "bg-danger/[0.06] text-danger" : "bg-success/[0.06] text-success")}>
        <span className={cn("size-2 rounded-full", status.source === "none" ? "bg-danger" : "bg-success")} aria-hidden />
        Currently sending with: <span className="font-semibold">{source}</span>
      </p>

      <form action={action} noValidate>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
          <input type="checkbox" name="enabled" checked={enabled} onChange={(ev) => setEnabled(ev.target.checked)} className="mt-0.5 size-4 accent-[rgb(var(--color-primary))]" />
          <span>
            <span className="block text-sm font-semibold text-gray-900">Use these settings</span>
            <span className="block text-xs text-gray-500">When off, the website keeps using the SMTP values from the server&apos;s .env file (if any).</span>
          </span>
        </label>

        <div className={cn("mt-6 grid gap-5 transition-opacity sm:grid-cols-2", !enabled && "opacity-60")}>
          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-gray-600">Quick fill</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PRESETS.map((pr) => (
                <button
                  key={pr.host}
                  type="button"
                  onClick={() => {
                    setHost(pr.host);
                    setPort(String(pr.port));
                  }}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    host === pr.host ? "border-primary bg-primary/10 text-primary-strong" : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>
          <Input name="host" label="SMTP server" value={host} onChange={(ev) => setHost(ev.target.value)} placeholder="e.g. smtp.gmail.com" error={e.host} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="port" label="Port" inputMode="numeric" value={port} onChange={(ev) => setPort(ev.target.value)} error={e.port} />
            <label className="block space-y-1.5">
              <span className="block font-display text-sm font-semibold text-gray-800">Security</span>
              <select
                name="security"
                defaultValue={smtp?.security ?? "auto"}
                className="block h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-[0.9375rem] text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="auto">Auto</option>
                <option value="tls">SSL/TLS</option>
                <option value="starttls">STARTTLS</option>
              </select>
            </label>
          </div>
          <Input name="user" label="Username" defaultValue={smtp?.user} autoComplete="off" placeholder="Mailbox, or API key for Mailjet/Brevo" error={e.user} />
          <div className="space-y-1.5">
            <Input
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              placeholder={smtp?.hasPassword ? "•••••••• (saved — leave blank to keep)" : "App password or secret key"}
              disabled={clearPw}
              error={e.password}
            />
            {smtp?.hasPassword && (
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input type="checkbox" name="clearPassword" checked={clearPw} onChange={(ev) => setClearPw(ev.target.checked)} className="size-3.5" />
                Remove the saved password
              </label>
            )}
          </div>
          <Input
            name="from"
            label="Sender (From)"
            defaultValue={smtp?.from}
            placeholder='e.g. Picode Website <no-reply@picode.ai>'
            hint="Must be an address your mail provider allows you to send from."
            error={e.from}
            wrapperClassName="sm:col-span-2"
          />
          <Input name="notifyTo" label="Send inquiry notifications to" defaultValue={smtp?.notifyTo} placeholder="sales@picode.ai, you@picode.ai" hint="Comma-separated" error={e.notifyTo} />
          <Input
            name="careersNotifyTo"
            label="Send job applications to (optional)"
            defaultValue={smtp?.careersNotifyTo}
            placeholder="Same as inquiries"
            hint="Comma-separated; empty = same as inquiries"
            error={e.careersNotifyTo}
          />
        </div>
        <p className="mt-4 text-xs text-gray-500">The password is encrypted before it&apos;s stored and is never shown again or included in exports.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <SaveButton />
          <SavedToast message={state.ok ? state.message : undefined} stamp={state} />
        </div>
      </form>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="font-display text-sm font-semibold text-gray-800">Send a test email</p>
        <p className="mt-0.5 text-xs text-gray-500">Uses whatever is currently in use (save first to test new settings).</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={testTo}
            onChange={(ev) => setTestTo(ev.target.value)}
            placeholder="you@company.com"
            aria-label="Send test email to"
            className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 focus:border-transparent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            variant="outline"
            disabled={testing || !testTo}
            onClick={() => startTest(async () => setTest(await sendTestEmailAction(testTo)))}
            leftIcon={testing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          >
            {testing ? "Sending…" : "Send test"}
          </Button>
        </div>
        {test && (
          <p role="status" className={cn("mt-3 text-sm", test.ok ? "text-success" : "text-danger")}>
            {test.message}
          </p>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Export                                                               */
/* ------------------------------------------------------------------ */

function SectionChecks({ value, onChange, counts }: { value: Section[]; onChange: (v: Section[]) => void; counts?: Partial<Record<Section, string>> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {SECTIONS.filter(([id]) => !counts || counts[id] !== undefined).map(([id, label]) => (
        <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 text-sm hover:border-gray-300">
          <input
            type="checkbox"
            checked={value.includes(id)}
            onChange={() => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])}
            className="size-4 accent-[rgb(var(--color-primary))]"
          />
          <span className="flex-1 font-medium text-gray-800">{label}</span>
          {counts?.[id] && <span className="text-xs text-gray-400">{counts[id]}</span>}
        </label>
      ))}
    </div>
  );
}

function ExportCard() {
  const [sections, setSections] = useState<Section[]>(SECTIONS.map(([id]) => id));
  const [files, setFiles] = useState(false);
  const href = `/admin/data/export?sections=${sections.join(",")}${files ? "&files=1" : ""}`;

  return (
    <Card icon={<Download className="size-5" />} title="Export website data" subtitle="Download everything as one JSON file, for backups or moving to another server.">
      <SectionChecks value={sections} onChange={setSections} />
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-gray-700">
        <input type="checkbox" checked={files} onChange={(e) => setFiles(e.target.checked)} className="mt-0.5 size-4 accent-[rgb(var(--color-primary))]" />
        <span>
          Include files: case-study images and applicants&apos; resumes
          <span className="block text-xs text-gray-500">Makes the file larger. Without it, image paths are kept but resumes aren&apos;t.</span>
        </span>
      </label>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={sections.length ? href : undefined}
          aria-disabled={!sections.length}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full bg-gradient-primary px-6 font-display text-sm font-semibold text-white shadow-glow transition-opacity",
            !sections.length && "pointer-events-none opacity-40",
          )}
        >
          <Download className="size-4" aria-hidden /> Download JSON
        </a>
        <p className="text-xs text-gray-500">Contains personal data (inquiries, applicants). Store it securely.</p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Import                                                               */
/* ------------------------------------------------------------------ */

type Peek = { name: string; size: number; exportedAt?: string; counts: Partial<Record<Section, string>>; error?: string };
type Result = { ok: true; summary: { section: string; imported: number; skipped: number; note?: string }[] } | { ok: false; error: string };

function describe(json: unknown): Pick<Peek, "counts" | "exportedAt" | "error"> {
  const doc = json as { format?: string; exportedAt?: string; data?: Record<string, unknown>; files?: { uploads?: object; resumes?: object } };
  if (doc?.format !== "picode-site-export" || !doc.data) return { counts: {}, error: "This isn't a Picode export file." };
  const d = doc.data;
  const n = (k: string) => (Array.isArray(d[k]) ? (d[k] as unknown[]).length : undefined);
  const counts: Partial<Record<Section, string>> = {};
  if (d.settings || d.preferences) counts.settings = "included";
  for (const k of ["offices", "caseStudies", "inquiries", "jobs", "applications"] as const) {
    const c = n(k);
    if (c !== undefined) counts[k] = `${c} ${c === 1 ? "item" : "items"}`;
  }
  if (counts.caseStudies && doc.files?.uploads) counts.caseStudies += ` · ${Object.keys(doc.files.uploads).length} images`;
  if (counts.applications && doc.files?.resumes) counts.applications += ` · ${Object.keys(doc.files.resumes).length} resumes`;
  if (d.services) counts.services = "included";
  return { counts, exportedAt: doc.exportedAt };
}

function ImportCard() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function choose(f: File | undefined) {
    setResult(null);
    if (!f) return;
    setFile(f);
    try {
      const info = describe(JSON.parse(await f.text()));
      setPeek({ name: f.name, size: f.size, ...info });
      setSections(Object.keys(info.counts) as Section[]);
    } catch {
      setPeek({ name: f.name, size: f.size, counts: {}, error: "That file isn't valid JSON." });
      setSections([]);
    }
  }

  function clear() {
    setFile(null);
    setPeek(null);
    setSections([]);
    setConfirmReplace(false);
    if (input.current) input.current.value = "";
  }

  async function run() {
    if (!file || !sections.length) return;
    if (mode === "replace" && !confirmReplace) return setConfirmReplace(true);
    setBusy(true);
    setResult(null);
    const body = new FormData();
    body.set("file", file);
    body.set("sections", sections.join(","));
    body.set("mode", mode);
    try {
      const res = await fetch("/admin/data/import", { method: "POST", body });
      setResult((await res.json()) as Result);
      if (res.ok) clear();
    } catch {
      setResult({ ok: false, error: "Couldn't reach the server." });
    } finally {
      setBusy(false);
      setConfirmReplace(false);
    }
  }

  const when = useMemo(() => (peek?.exportedAt ? new Date(peek.exportedAt).toLocaleString() : null), [peek]);

  return (
    <Card icon={<Upload className="size-5" />} title="Import website data" subtitle="Load a JSON export: jobs, offices, case studies, applications, the services page and more.">
      {!peek ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center transition-colors hover:border-primary/50"
        >
          <FileJson className="size-8 text-primary-strong" aria-hidden />
          <span className="mt-3 text-sm font-semibold text-gray-900">Choose an export file</span>
          <span className="mt-1 text-xs text-gray-500">picode-site-export-….json</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FileJson className="size-5 text-primary-strong" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{peek.name}</p>
              <p className="text-xs text-gray-500">
                {(peek.size / 1024 / 1024).toFixed(2)} MB{when ? ` · exported ${when}` : ""}
              </p>
            </div>
            <button type="button" onClick={clear} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Remove file">
              <X className="size-4" />
            </button>
          </div>
          {peek.error ? (
            <p className="mt-4 text-sm font-medium text-danger">{peek.error}</p>
          ) : (
            <>
              <p className="mb-2 mt-5 font-display text-sm font-semibold text-gray-800">What to import</p>
              <SectionChecks value={sections} onChange={setSections} counts={peek.counts} />

              <p className="mb-2 mt-5 font-display text-sm font-semibold text-gray-800">How</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Mode checked={mode === "merge"} onChange={() => setMode("merge")} title="Merge" text="Add new records and update ones with the same id. Nothing is deleted." />
                <Mode checked={mode === "replace"} onChange={() => setMode("replace")} title="Replace" text="Delete what's there for each chosen section, then import." danger />
              </div>

              {confirmReplace && (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/[0.05] p-3 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Replace will permanently delete the current {sections.length === 1 ? "section" : "sections"} you picked. Click Import again to confirm.
                </p>
              )}
              <div className="mt-6">
                <Button
                  onClick={run}
                  disabled={busy || !sections.length}
                  leftIcon={busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                >
                  {busy ? "Importing…" : confirmReplace ? "Yes, replace and import" : "Import"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void choose(e.target.files?.[0])}
      />

      {result && (
        <div
          role="status"
          className={cn(
            "mt-6 rounded-2xl border p-4 text-sm",
            result.ok ? "border-success/30 bg-success/[0.05]" : "border-danger/30 bg-danger/[0.05] text-danger",
          )}
        >
          {result.ok ? (
            <>
              <p className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="size-4" aria-hidden /> Import complete
              </p>
              <ul className="mt-2 space-y-1 text-gray-700">
                {result.summary.map((r) => (
                  <li key={r.section}>
                    <span className="font-medium">{r.section}:</span> {r.imported} imported
                    {r.skipped ? `, ${r.skipped} skipped (invalid)` : ""}
                    {r.note ? ` · ${r.note}` : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            result.error
          )}
        </div>
      )}
    </Card>
  );
}

function Mode({ checked, onChange, title, text, danger }: { checked: boolean; onChange: () => void; title: string; text: string; danger?: boolean }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors",
        checked ? (danger ? "border-danger/50 bg-danger/[0.04]" : "border-primary/60 bg-primary/[0.05]") : "border-gray-200 hover:border-gray-300",
      )}
    >
      <input type="radio" checked={checked} onChange={onChange} className="mt-1 accent-[rgb(var(--color-primary))]" />
      <span>
        <span className="block text-sm font-semibold text-gray-900">{title}</span>
        <span className="block text-xs text-gray-500">{text}</span>
      </span>
    </label>
  );
}
