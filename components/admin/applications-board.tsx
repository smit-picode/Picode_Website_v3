"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Globe2,
  Inbox,
  Languages,
  Link2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deleteApplicationAction, setApplicationStatusAction } from "@/app/admin/actions";
import {
  APPLICATION_STATUSES,
  STATUS_LABEL,
  WORK_MODES,
  type Application,
  type ApplicationStatus,
  type JobPost,
} from "@/lib/content/careers";
import { formatDate, formatDateTime, type Preferences } from "@/lib/format";
import { cn } from "@/lib/utils";

type Sort = "newest" | "oldest" | "exp-desc" | "exp-asc" | "name";
const POOL = "__pool";

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  new: "bg-primary/10 text-primary-strong",
  reviewing: "bg-secondary/10 text-secondary-strong",
  shortlisted: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  interview: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  hired: "bg-success/10 text-success",
  rejected: "bg-gray-100 text-gray-500",
};

const norm = (s: string) => s.trim().toLowerCase();
/** Distinct values (case-insensitive) with counts, most common first. */
function facet(values: string[]) {
  const map = new Map<string, { label: string; n: number }>();
  for (const v of values) {
    const k = norm(v);
    if (!k) continue;
    const cur = map.get(k);
    if (cur) cur.n++;
    else map.set(k, { label: v.trim(), n: 1 });
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

export function ApplicationsBoard({
  applications,
  jobs,
  initialJob,
  preferences,
}: {
  applications: Application[];
  jobs: JobPost[];
  preferences: Preferences;
  initialJob?: string;
}) {
  const [overrides, setOverrides] = useState<Record<string, ApplicationStatus | "deleted">>({});
  const [, startTransition] = useTransition();

  // filters
  const [q, setQ] = useState("");
  const [role, setRole] = useState(initialJob ?? "all");
  const [status, setStatus] = useState<"active" | "all" | ApplicationStatus>("active");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillMode, setSkillMode] = useState<"any" | "all">("all");
  const [langs, setLangs] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [minExp, setMinExp] = useState("");
  const [maxExp, setMaxExp] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [showFilters, setShowFilters] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const live = useMemo(
    () =>
      applications
        .filter((a) => overrides[a.id] !== "deleted")
        .map((a) => (overrides[a.id] ? { ...a, status: overrides[a.id] as ApplicationStatus } : a)),
    [applications, overrides],
  );

  const skillFacet = useMemo(() => facet(live.flatMap((a) => a.skills)), [live]);
  const langFacet = useMemo(() => facet(live.flatMap((a) => a.languages)), [live]);
  const countryFacet = useMemo(() => facet(live.map((a) => a.country)), [live]);
  const cityFacet = useMemo(
    () => facet(live.filter((a) => !country || norm(a.country) === country).map((a) => a.city)),
    [live, country],
  );
  const roleOptions = useMemo(() => {
    const titles = new Map<string, string>();
    for (const j of jobs) titles.set(j.id, j.title);
    for (const a of live) if (a.jobId && !titles.has(a.jobId)) titles.set(a.jobId, a.jobTitle ?? a.jobId);
    return [...titles.entries()];
  }, [jobs, live]);

  const items = useMemo(() => {
    const text = norm(q);
    const min = minExp === "" ? -1 : Number(minExp);
    const max = maxExp === "" ? Infinity : Number(maxExp);
    const out = live.filter((a) => {
      if (role === POOL ? a.jobId || a.jobTitle : role !== "all" && a.jobId !== role) return false;
      if (status === "active" ? a.status === "rejected" : status !== "all" && a.status !== status) return false;
      const aSkills = a.skills.map(norm);
      if (skills.length && (skillMode === "all" ? !skills.every((s) => aSkills.includes(s)) : !skills.some((s) => aSkills.includes(s)))) return false;
      const aLangs = a.languages.map(norm);
      if (langs.length && !langs.every((l) => aLangs.includes(l))) return false;
      if (country && norm(a.country) !== country) return false;
      if (city && norm(a.city) !== city) return false;
      if (a.experienceYears < min || a.experienceYears > max) return false;
      if (workMode && a.workMode !== workMode) return false;
      if (text) {
        const hay = [a.name, a.email, a.currentTitle, a.city, a.country, a.jobTitle ?? "talent pool", a.note, ...a.skills, ...a.languages]
          .join(" ")
          .toLowerCase();
        if (!text.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const by: Record<Sort, (a: Application, b: Application) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      "exp-desc": (a, b) => b.experienceYears - a.experienceYears,
      "exp-asc": (a, b) => a.experienceYears - b.experienceYears,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return out.sort(by[sort]);
  }, [live, q, role, status, skills, skillMode, langs, country, city, minExp, maxExp, workMode, sort]);

  const activeFilters =
    (role !== "all" ? 1 : 0) +
    (status !== "active" ? 1 : 0) +
    skills.length +
    langs.length +
    (country ? 1 : 0) +
    (city ? 1 : 0) +
    (minExp || maxExp ? 1 : 0) +
    (workMode ? 1 : 0);

  function clearAll() {
    setQ("");
    setRole("all");
    setStatus("active");
    setSkills([]);
    setLangs([]);
    setCountry("");
    setCity("");
    setMinExp("");
    setMaxExp("");
    setWorkMode("");
  }

  function changeStatus(id: string, s: ApplicationStatus) {
    setOverrides((o) => ({ ...o, [id]: s }));
    startTransition(() => setApplicationStatusAction(id, s));
  }
  function remove(id: string) {
    setOverrides((o) => ({ ...o, [id]: "deleted" }));
    setConfirmId(null);
    startTransition(() => deleteApplicationAction(id));
  }
  function open(a: Application) {
    const opening = openId !== a.id;
    setOpenId(opening ? a.id : null);
    if (opening && a.status === "new") changeStatus(a.id, "reviewing");
  }

  const toggleIn = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const stats = APPLICATION_STATUSES.map((s) => ({ s, n: live.filter((a) => a.status === s).length }));

  return (
    <div className="space-y-5">
      {/* pipeline summary */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {stats.map(({ s, n }) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(status === s ? "active" : s)}
            className={cn(
              "rounded-xl border bg-surface px-3 py-2.5 text-left shadow-soft transition-colors",
              status === s ? "border-primary/50 ring-2 ring-primary/15" : "border-gray-100 hover:border-gray-200",
            )}
          >
            <span className="block font-display text-xl font-semibold tabular-nums text-gray-900">{n}</span>
            <span className="block text-xs text-gray-500">{STATUS_LABEL[s]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* ---------------- filters ---------------- */}
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-surface shadow-soft">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="flex w-full items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 lg:cursor-default"
              aria-expanded={showFilters}
            >
              <span className="inline-flex items-center gap-2">
                <Filter className="size-4 text-primary-strong" aria-hidden /> Filters
                {activeFilters > 0 && <span className="rounded-full bg-gradient-primary px-1.5 text-[0.6875rem] text-white">{activeFilters}</span>}
              </span>
              <ChevronDown className={cn("size-4 text-gray-400 transition-transform lg:hidden", showFilters && "rotate-180")} aria-hidden />
            </button>

            <div className={cn("space-y-5 p-4", !showFilters && "hidden lg:block")}>
              <Field label="Role">
                <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
                  <option value="all">All roles</option>
                  <option value={POOL}>Talent pool (no role)</option>
                  {roleOptions.map(([id, title]) => (
                    <option key={id} value={id}>
                      {title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectCls}>
                  <option value="active">Active (hide not a fit)</option>
                  <option value="all">All statuses</option>
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Skills"
                extra={
                  skills.length > 1 ? (
                    <button type="button" onClick={() => setSkillMode(skillMode === "all" ? "any" : "all")} className="text-[0.6875rem] font-semibold text-primary-strong">
                      Match {skillMode === "all" ? "all" : "any"}
                    </button>
                  ) : null
                }
              >
                <ChipFacet items={skillFacet} selected={skills} onToggle={(k) => toggleIn(skills, setSkills, k)} empty="No skills yet" />
              </Field>

              <Field label="Languages">
                <ChipFacet items={langFacet} selected={langs} onToggle={(k) => toggleIn(langs, setLangs, k)} empty="No languages yet" />
              </Field>

              <Field label="Country / region">
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setCity("");
                  }}
                  className={selectCls}
                >
                  <option value="">Anywhere</option>
                  {countryFacet.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} ({c.n})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="City">
                <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                  <option value="">Any city</option>
                  {cityFacet.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} ({c.n})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Experience (years)">
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={50} inputMode="numeric" placeholder="Min" value={minExp} onChange={(e) => setMinExp(e.target.value)} className={cn(selectCls, "w-full")} aria-label="Minimum years" />
                  <span className="text-gray-400">–</span>
                  <input type="number" min={0} max={50} inputMode="numeric" placeholder="Max" value={maxExp} onChange={(e) => setMaxExp(e.target.value)} className={cn(selectCls, "w-full")} aria-label="Maximum years" />
                </div>
              </Field>

              <Field label="Work mode">
                <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className={selectCls}>
                  <option value="">Any</option>
                  {WORK_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              {activeFilters > 0 && (
                <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
                  <RotateCcw className="size-3.5" aria-hidden /> Clear filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ---------------- results ---------------- */}
        <div className="min-w-0 rounded-2xl border border-gray-100 bg-surface shadow-soft">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search applications</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, skill, city…"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap text-sm text-gray-500">
                {items.length} of {live.length}
              </span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cn(selectCls, "h-10 w-auto")} aria-label="Sort">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="exp-desc">Most experienced</option>
                <option value="exp-asc">Least experienced</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="mx-auto size-8 text-gray-300" aria-hidden />
              <p className="mt-3 font-semibold text-gray-900">{live.length ? "No applications match these filters" : "No applications yet"}</p>
              <p className="mt-1 text-sm text-gray-500">
                {live.length ? "Try removing a filter." : "Applications and talent-pool resumes from /careers will appear here."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((a) => {
                const isOpen = openId === a.id;
                const place = [a.city, a.country].filter(Boolean).join(", ");
                return (
                  <li key={a.id}>
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
                      <button type="button" onClick={() => open(a)} className="flex min-w-0 flex-1 gap-3 text-left" aria-expanded={isOpen}>
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary-soft font-display text-sm font-bold text-primary-strong">
                          {a.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase())
                            .join("")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-gray-900">{a.name}</span>
                            {a.status === "new" && <span className="size-2 rounded-full bg-primary" aria-label="New" />}
                            <span className="text-xs text-gray-500">
                              {a.jobTitle ? `→ ${a.jobTitle}` : "→ Talent pool"}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-sm text-gray-500">
                            {[a.currentTitle, `${a.experienceYears} yrs`, place].filter(Boolean).join(" · ")}
                          </span>
                          <span className="mt-2 flex flex-wrap gap-1">
                            {a.skills.slice(0, 8).map((s) => (
                              <span
                                key={s}
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium",
                                  skills.includes(norm(s)) ? "bg-primary text-white" : "bg-gray-100 text-gray-600",
                                )}
                              >
                                {s}
                              </span>
                            ))}
                            {a.skills.length > 8 && <span className="px-1 text-[0.6875rem] text-gray-400">+{a.skills.length - 8}</span>}
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-2 pl-[3.25rem] sm:pl-0">
                        <select
                          value={a.status}
                          onChange={(e) => changeStatus(a.id, e.target.value as ApplicationStatus)}
                          className={cn("h-8 rounded-lg border-0 px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary", STATUS_STYLE[a.status])}
                          aria-label={`Status for ${a.name}`}
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        {a.resume && (
                          <a
                            href={`/admin/resumes/${a.id}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            aria-label={`Download ${a.name}'s resume`}
                            title="Download resume"
                          >
                            <Download className="size-4" />
                          </a>
                        )}
                        <time className="hidden whitespace-nowrap text-xs text-gray-400 md:block" dateTime={a.createdAt}>
                          {formatDate(a.createdAt, preferences.dateFormat)}
                        </time>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-4 mb-5 grid gap-5 rounded-xl bg-gray-50 p-5 sm:mx-5 md:grid-cols-[1fr_16rem]">
                            <div className="space-y-4 text-sm">
                              <div className="flex flex-wrap gap-x-5 gap-y-2 text-gray-600">
                                <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1.5 hover:text-primary-strong">
                                  <Mail className="size-4" aria-hidden /> {a.email}
                                </a>
                                {a.phone && (
                                  <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-primary-strong">
                                    <Phone className="size-4" aria-hidden /> {a.phone}
                                  </a>
                                )}
                                {place && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="size-4" aria-hidden /> {place}
                                  </span>
                                )}
                              </div>
                              <dl className="grid gap-3 sm:grid-cols-2">
                                <Info label="Languages" icon={Languages}>{a.languages.join(", ")}</Info>
                                <Info label="Work mode · notice" icon={Globe2}>
                                  {[a.workMode, a.noticePeriod].filter(Boolean).join(" · ") || "—"}
                                </Info>
                              </dl>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">All skills</p>
                                <p className="mt-1.5 text-gray-700">{a.skills.join(", ")}</p>
                              </div>
                              {a.note && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Note from candidate</p>
                                  <p className="mt-1.5 whitespace-pre-wrap text-gray-700">{a.note}</p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-3">
                                {a.linkedin && <ExtLink href={a.linkedin} icon={Link2}>LinkedIn</ExtLink>}
                                {a.portfolio && <ExtLink href={a.portfolio} icon={ExternalLink}>Portfolio</ExtLink>}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {a.resume ? (
                                <div className="rounded-xl border border-gray-200 bg-surface p-3">
                                  <div className="flex items-center gap-3">
                                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
                                      <FileText className="size-4" aria-hidden />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-medium text-gray-900">{a.resume.fileName}</span>
                                      <span className="block text-xs text-gray-500">{Math.max(1, Math.round(a.resume.sizeBytes / 1024))} KB</span>
                                    </span>
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    {a.resume.mimeType === "application/pdf" && (
                                      <a
                                        href={`/admin/resumes/${a.id}?inline=1`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                      >
                                        Open
                                      </a>
                                    )}
                                    <a href={`/admin/resumes/${a.id}`} className="flex-1 rounded-lg bg-gradient-primary px-3 py-1.5 text-center text-xs font-semibold text-white">
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No resume attached.</p>
                              )}
                              <p className="text-xs text-gray-400">
                                Received {formatDateTime(a.createdAt, preferences)}
                              </p>
                              {confirmId === a.id ? (
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => remove(a.id)} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white">
                                    Delete permanently
                                  </button>
                                  <button type="button" onClick={() => setConfirmId(null)} className="text-xs text-gray-500 hover:text-gray-900">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmId(a.id)}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-danger"
                                >
                                  <Trash2 className="size-3.5" aria-hidden /> Delete application & resume
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const selectCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-sm text-gray-900 focus:border-transparent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, extra, children }: { label: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

function ChipFacet({
  items,
  selected,
  onToggle,
  empty,
}: {
  items: { key: string; label: string; n: number }[];
  selected: string[];
  onToggle: (key: string) => void;
  empty: string;
}) {
  const [all, setAll] = useState(false);
  if (!items.length) return <p className="text-xs text-gray-400">{empty}</p>;
  const shown = all ? items : items.slice(0, 12);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((it) => {
        const on = selected.includes(it.key);
        return (
          <button
            key={it.key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(it.key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors",
              on ? "border-transparent bg-primary text-white" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900",
            )}
          >
            {it.label}
            <span className={on ? "text-white/75" : "text-gray-400"}>{it.n}</span>
            {on && <X className="size-3" aria-hidden />}
          </button>
        );
      })}
      {items.length > 12 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="px-1 text-xs font-semibold text-primary-strong">
          {all ? "Show less" : `+${items.length - 12} more`}
        </button>
      )}
    </div>
  );
}

function Info({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <Icon className="size-3.5" aria-hidden /> {label}
      </dt>
      <dd className="mt-1 text-gray-700">{children}</dd>
    </div>
  );
}

function ExtLink({ href, icon: Icon, children }: { href: string; icon: typeof Mail; children: React.ReactNode }) {
  // Candidate-supplied links: only http(s), opened without referrer/opener.
  if (!/^https?:\/\//i.test(href)) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener nofollow"
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300"
    >
      <Icon className="size-3.5" aria-hidden /> {children}
    </a>
  );
}
