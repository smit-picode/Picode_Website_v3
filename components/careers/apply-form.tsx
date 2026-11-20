"use client";

import { useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Globe2,
  Languages,
  Loader2,
  MapPin,
  Send,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { TagInput } from "@/components/careers/tag-input";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  COUNTRY_SUGGESTIONS,
  LANGUAGE_SUGGESTIONS,
  NOTICE_PERIODS,
  RESUME_ACCEPT,
  RESUME_MAX_BYTES,
  SKILL_SUGGESTIONS,
  WORK_MODES,
  type ApplicationFieldErrors,
  type ApplyResponse,
} from "@/lib/content/careers";
import { cn, replyWhen } from "@/lib/utils";

type Draft = {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  currentTitle: string;
  experienceYears: number;
  skills: string[];
  languages: string[];
  workMode: string;
  noticePeriod: string;
  linkedin: string;
  portfolio: string;
  note: string;
  consent: boolean;
  website: string;
};

const EMPTY: Draft = {
  name: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  currentTitle: "",
  experienceYears: 2,
  skills: [],
  languages: ["English"],
  workMode: "",
  noticePeriod: "",
  linkedin: "",
  portfolio: "",
  note: "",
  consent: false,
  website: "",
};

const STEPS = [
  { title: "You", hint: "How we reach you" },
  { title: "Your craft", hint: "Skills & experience" },
  { title: "Resume", hint: "Attach and send" },
] as const;

/** Which step a server-side field error belongs to. */
const STEP_OF: Partial<Record<keyof ApplicationFieldErrors, number>> = {
  name: 0,
  email: 0,
  phone: 0,
  city: 0,
  country: 0,
  currentTitle: 1,
  experienceYears: 1,
  skills: 1,
  languages: 1,
  workMode: 1,
  noticePeriod: 1,
  linkedin: 1,
  portfolio: 1,
  note: 2,
  consent: 2,
  resume: 2,
};

const EMAIL = /^\S+@\S+\.\S+$/;
const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * Three-step application with a live candidate card that fills in as you type.
 * Used on job pages (job set) and for the general talent pool (no job).
 */
export function ApplyForm({
  job,
  responseTime,
}: {
  job?: { id: string; title: string; skills: string[] };
  responseTime: string;
}) {
  const reduce = useReducedMotion();
  const [d, setD] = useState<Draft>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<ApplicationFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [ref, setRef] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    if (errors[k as keyof ApplicationFieldErrors]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const skillSuggestions = [...(job?.skills ?? []), ...SKILL_SUGGESTIONS].filter(
    (s, i, a) => a.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i,
  );

  function validate(s: number): ApplicationFieldErrors {
    const e: ApplicationFieldErrors = {};
    if (s === 0) {
      if (d.name.trim().length < 2) e.name = "Please enter your full name";
      if (!EMAIL.test(d.email.trim())) e.email = "Please enter a valid email";
      if (d.phone.trim() && !/^\+?[\d\s()-]{7,22}$/.test(d.phone.trim())) e.phone = "Use digits with the country code";
      if (d.city.trim().length < 2) e.city = "Where are you based?";
      if (d.country.trim().length < 2) e.country = "Which country?";
    }
    if (s === 1) {
      if (!d.skills.length) e.skills = "Add at least one skill";
      if (!d.languages.length) e.languages = "Add at least one language";
      for (const k of ["linkedin", "portfolio"] as const) {
        if (d[k].trim() && !/^https?:\/\/\S+\.\S+$/i.test(d[k].trim())) e[k] = "Enter a full link starting with https://";
      }
    }
    if (s === 2) {
      if (!file) e.resume = "Attach your resume (PDF or Word, up to 5 MB)";
      if (!d.consent) e.consent = "Please agree so we can keep your details";
    }
    return e;
  }

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  function nextStep() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    go(step + 1);
  }

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    if (!/\.(pdf|docx?)$/i.test(f.name)) {
      setErrors((e) => ({ ...e, resume: "Upload a PDF or Word document (.pdf, .doc, .docx)" }));
      return;
    }
    if (f.size > RESUME_MAX_BYTES) {
      setErrors((e) => ({ ...e, resume: "Resumes must be 5 MB or smaller" }));
      return;
    }
    setFile(f);
    setErrors((e) => ({ ...e, resume: undefined }));
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (step < STEPS.length - 1) return nextStep();
    const all = { ...validate(0), ...validate(1), ...validate(2) };
    setErrors(all);
    const firstBad = Object.keys(all)[0] as keyof ApplicationFieldErrors | undefined;
    if (firstBad) return go(STEP_OF[firstBad] ?? 2);

    setStatus("sending");
    setFormError(null);
    const body = new FormData();
    body.set("jobId", job?.id ?? "");
    for (const k of ["name", "email", "phone", "city", "country", "currentTitle", "workMode", "noticePeriod", "linkedin", "portfolio", "note", "website"] as const) {
      body.set(k, d[k].trim());
    }
    body.set("experienceYears", String(d.experienceYears));
    d.skills.forEach((s) => body.append("skills", s));
    d.languages.forEach((s) => body.append("languages", s));
    if (d.consent) body.set("consent", "on");
    if (file) body.set("resume", file);

    try {
      const res = await fetch("/api/careers/apply", { method: "POST", body });
      const data = (await res.json()) as ApplyResponse;
      if (data.ok) {
        setRef(data.ref);
        setStatus("sent");
        topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        return;
      }
      setStatus("idle");
      setFormError(data.error);
      if (data.fieldErrors) {
        setErrors(data.fieldErrors);
        const bad = Object.keys(data.fieldErrors)[0] as keyof ApplicationFieldErrors | undefined;
        if (bad) go(STEP_OF[bad] ?? 2);
      }
    } catch {
      setStatus("idle");
      setFormError("We couldn't reach our server. Check your connection and try again.");
    }
  }

  function reset() {
    setD(EMPTY);
    setFile(null);
    setErrors({});
    setFormError(null);
    setStatus("idle");
    setStep(0);
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div ref={topRef} className="scroll-mt-28">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---------------- form ---------------- */}
        <div className="rounded-3xl border border-gray-200/90 bg-surface p-5 shadow-soft sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            {status === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[26rem] flex-col items-center justify-center text-center"
                role="status"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                  className="flex size-16 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow"
                >
                  <CheckCircle2 className="size-8" aria-hidden />
                </motion.span>
                <h3 className="mt-6 font-display text-2xl font-semibold text-gray-900">Application received</h3>
                <p className="mt-2 max-w-md text-body-sm text-gray-500">
                  Thanks, {d.name.split(" ")[0]}. {job ? `Your application for ${job.title} is with our team.` : "Your resume is in our talent pool."}{" "}
                  We&apos;ll be in touch at <span className="font-medium text-gray-900">{d.email}</span>{" "}
                  {job ? replyWhen(responseTime) : "when a role fits your profile"}.
                </p>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-gray-400">Reference · {ref}</p>
                <button type="button" onClick={reset} className="mt-8 text-sm font-medium text-primary-strong hover:underline">
                  Send another application
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} noValidate initial={false}>
                {/* step rail */}
                <ol className="grid grid-cols-3 gap-2" aria-label="Application steps">
                  {STEPS.map((s, i) => {
                    const done = i < step;
                    const on = i === step;
                    return (
                      <li key={s.title}>
                        <button
                          type="button"
                          onClick={() => (i < step ? go(i) : undefined)}
                          disabled={i > step}
                          aria-current={on ? "step" : undefined}
                          className="group w-full text-left disabled:cursor-default"
                        >
                          <span className="block h-1 overflow-hidden rounded-full bg-gray-100">
                            <motion.span
                              className="block h-full rounded-full bg-gradient-primary"
                              initial={false}
                              animate={{ width: done || on ? "100%" : "0%" }}
                              transition={{ duration: reduce ? 0 : 0.5 }}
                            />
                          </span>
                          <span className={cn("mt-2.5 flex items-center gap-1.5 font-display text-sm font-semibold", on || done ? "text-gray-900" : "text-gray-400")}>
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full text-[0.625rem]",
                                done ? "bg-gradient-primary text-white" : on ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500",
                              )}
                            >
                              {done ? "✓" : i + 1}
                            </span>
                            {s.title}
                          </span>
                          <span className="mt-0.5 hidden text-xs text-gray-500 sm:block">{s.hint}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <div className="relative mt-8 min-h-[22rem]">
                  <AnimatePresence mode="wait" initial={false} custom={dir}>
                    <motion.div
                      key={step}
                      custom={dir}
                      initial={{ opacity: 0, x: reduce ? 0 : 24 * dir }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: reduce ? 0 : -24 * dir }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {step === 0 && (
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Input label="Full name" value={d.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="e.g. Peter Parker" error={errors.name} wrapperClassName="sm:col-span-2" />
                          <Input label="Email" type="email" value={d.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="e.g. peter.parker@example.com" error={errors.email} />
                          <Input label="Phone (optional)" type="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="e.g. +91 98765 43210" error={errors.phone} />
                          <Input label="City" value={d.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" placeholder="e.g. Bengaluru" error={errors.city} />
                          <Input
                            label="Country"
                            list="apply-countries"
                            value={d.country}
                            onChange={(e) => set("country", e.target.value)}
                            autoComplete="country-name"
                            placeholder="e.g. India"
                            error={errors.country}
                          />
                          <datalist id="apply-countries">
                            {COUNTRY_SUGGESTIONS.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                          {/* honeypot */}
                          <input
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden
                            value={d.website}
                            onChange={(e) => set("website", e.target.value)}
                            className="absolute left-[-9999px] h-0 w-0 opacity-0"
                          />
                        </div>
                      )}

                      {step === 1 && (
                        <div className="grid gap-6">
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Input label="Current role (optional)" value={d.currentTitle} onChange={(e) => set("currentTitle", e.target.value)} placeholder="e.g. Frontend Engineer" />
                            <div className="space-y-1.5">
                              <label htmlFor="apply-exp" className="flex items-baseline justify-between font-display text-sm font-semibold text-gray-800">
                                Experience
                                <span className="font-mono text-xs font-medium text-primary-strong">
                                  {d.experienceYears >= 20 ? "20+ years" : `${d.experienceYears} ${d.experienceYears === 1 ? "year" : "years"}`}
                                </span>
                              </label>
                              <input
                                id="apply-exp"
                                type="range"
                                min={0}
                                max={20}
                                step={1}
                                value={d.experienceYears}
                                onChange={(e) => set("experienceYears", Number(e.target.value))}
                                className="h-12 w-full cursor-pointer accent-[rgb(var(--color-primary))]"
                              />
                            </div>
                          </div>
                          <TagInput
                            label="Skills"
                            value={d.skills}
                            onChange={(v) => set("skills", v)}
                            suggestions={skillSuggestions}
                            placeholder="e.g. React, Python, Figma"
                            error={errors.skills}
                          />
                          <TagInput
                            label="Languages you speak"
                            value={d.languages}
                            onChange={(v) => set("languages", v)}
                            suggestions={LANGUAGE_SUGGESTIONS}
                            placeholder="e.g. English, Hindi"
                            error={errors.languages}
                            max={10}
                          />
                          <div className="grid gap-5 sm:grid-cols-2">
                            <ChoiceGroup label="Preferred work mode" options={WORK_MODES} value={d.workMode} onChange={(v) => set("workMode", v)} />
                            <ChoiceGroup label="Notice period" options={NOTICE_PERIODS} value={d.noticePeriod} onChange={(v) => set("noticePeriod", v)} />
                          </div>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Input label="LinkedIn (optional)" type="url" value={d.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="e.g. https://linkedin.com/in/peterparker" error={errors.linkedin} />
                            <Input label="Portfolio / GitHub (optional)" type="url" value={d.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="e.g. https://github.com/peterparker" error={errors.portfolio} />
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="grid gap-6">
                          <div>
                            <p className="font-display text-sm font-semibold text-gray-800">Resume</p>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => fileInput.current?.click()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  fileInput.current?.click();
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                              }}
                              onDragLeave={() => setDragging(false)}
                              onDrop={onDrop}
                              aria-describedby="resume-help"
                              data-invalid={errors.resume ? true : undefined}
                              className={cn(
                                "relative mt-1.5 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                dragging ? "border-primary bg-primary/[0.06]" : errors.resume ? "border-danger/60 bg-danger/[0.03]" : "border-gray-200 bg-gray-50 hover:border-primary/50",
                              )}
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {file ? (
                                  <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-gray-200 bg-surface p-3 text-left shadow-sm">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-white">
                                      <FileText className="size-5" aria-hidden />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-semibold text-gray-900">{file.name}</span>
                                      <span className="block text-xs text-gray-500">{fmtSize(file.size)} · ready to send</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                      }}
                                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                      aria-label="Remove file"
                                    >
                                      <X className="size-4" aria-hidden />
                                    </button>
                                  </motion.div>
                                ) : (
                                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                                    <motion.span
                                      animate={reduce ? undefined : { y: [0, -5, 0] }}
                                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                      className="flex size-12 items-center justify-center rounded-2xl bg-surface text-primary-strong shadow-soft"
                                    >
                                      <UploadCloud className="size-6" aria-hidden />
                                    </motion.span>
                                    <p className="mt-3 text-sm font-semibold text-gray-900">
                                      {dragging ? "Drop it here" : "Drag your resume here, or click to browse"}
                                    </p>
                                    <p id="resume-help" className="mt-1 text-xs text-gray-500">
                                      PDF or Word · up to 5 MB
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <input
                              ref={fileInput}
                              type="file"
                              accept={RESUME_ACCEPT}
                              className="sr-only"
                              tabIndex={-1}
                              aria-label="Resume file"
                              onChange={(e) => {
                                pickFile(e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                            {errors.resume && (
                              <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
                                {errors.resume}
                              </p>
                            )}
                          </div>
                          <Textarea
                            label={job ? "Why this role? (optional)" : "What kind of role are you looking for? (optional)"}
                            value={d.note}
                            onChange={(e) => set("note", e.target.value)}
                            rows={4}
                            maxLength={3000}
                            placeholder={job ? "A few lines about what draws you to it, or something you're proud of." : "e.g. Senior backend roles, open to relocating to Dubai."}
                            error={errors.note}
                          />
                          <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={d.consent}
                              onChange={(e) => set("consent", e.target.checked)}
                              className="mt-0.5 size-4 shrink-0 rounded border-gray-300 accent-[rgb(var(--color-primary))]"
                            />
                            <span>
                              I agree that Picode may store my details and resume to consider me for {job ? "this and future roles" : "future roles"}, and
                              contact me about them.
                              {errors.consent && <span role="alert" className="mt-1 block text-xs font-medium text-danger">{errors.consent}</span>}
                            </span>
                          </label>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {formError && (
                  <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/[0.05] px-4 py-3 text-sm text-danger">
                    {formError}
                  </p>
                )}

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-6">
                  {step > 0 ? (
                    <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                      <ArrowLeft className="size-4" aria-hidden /> Back
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Takes about 2 minutes</span>
                  )}
                  {step < STEPS.length - 1 ? (
                    <Button type="submit" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={status === "sending"}
                      rightIcon={status === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                    >
                      {status === "sending" ? "Sending…" : job ? "Submit application" : "Join the talent pool"}
                    </Button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* ---------------- live candidate card ---------------- */}
        <CandidateCard d={d} file={file} jobTitle={job?.title} sent={status === "sent"} />
      </div>
    </div>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold text-gray-800">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? "" : o)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                on ? "border-transparent bg-gray-900 text-white dark:bg-primary dark:text-gray-950" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A profile card that builds itself from the form, like a badge being printed. */
function CandidateCard({ d, file, jobTitle, sent }: { d: Draft; file: File | null; jobTitle?: string; sent: boolean }) {
  const initials =
    d.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  const place = [d.city.trim(), d.country.trim()].filter(Boolean).join(", ");
  const filled = [d.name, d.email, place, d.skills.length, d.languages.length, file].filter(Boolean).length;
  const pct = Math.round((filled / 6) * 100);

  return (
    <aside aria-label="Your application preview" className="lg:sticky lg:top-28 lg:self-start">
      <div className="relative overflow-hidden rounded-3xl bg-[#071a24] p-6 text-white shadow-[0_30px_60px_-30px_rgba(7,26,36,0.7)]">
        <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.45),transparent_65%)]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

        <div className="relative">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.22em] text-teal-300/90">{jobTitle ? "Applying for" : "Talent pool"}</p>
          <p className="mt-1 font-display text-sm font-semibold text-white/90">{jobTitle ?? "Future roles at Picode"}</p>

          <div className="mt-6 flex items-center gap-4">
            <motion.span
              key={initials}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-sky-400 font-display text-lg font-bold text-[#04202c]"
            >
              {initials === "?" ? <UserRound className="size-6" aria-hidden /> : initials}
            </motion.span>
            <div className="min-w-0">
              <p className={cn("truncate font-display text-lg font-semibold", !d.name && "text-white/35")}>{d.name || "Your name"}</p>
              <p className={cn("truncate text-xs", d.currentTitle ? "text-white/70" : "text-white/30")}>{d.currentTitle || "Current role"}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-2.5 text-xs">
            <Row icon={MapPin} on={Boolean(place)}>{place || "City, country"}</Row>
            <Row icon={Briefcase} on>{d.experienceYears >= 20 ? "20+ years" : `${d.experienceYears} ${d.experienceYears === 1 ? "year" : "years"}`} experience</Row>
            <Row icon={Languages} on={d.languages.length > 0}>{d.languages.join(" · ") || "Languages"}</Row>
            {d.workMode && <Row icon={Globe2} on>{d.workMode}{d.noticePeriod ? ` · ${d.noticePeriod}` : ""}</Row>}
          </dl>

          <div className="mt-5 flex min-h-[3.25rem] flex-wrap content-start gap-1.5">
            <AnimatePresence initial={false}>
              {d.skills.length ? (
                d.skills.slice(0, 10).map((s) => (
                  <motion.span
                    key={s}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="rounded-md bg-white/10 px-2 py-1 text-[0.6875rem] font-medium text-teal-100"
                  >
                    {s}
                  </motion.span>
                ))
              ) : (
                <span className="rounded-md border border-dashed border-white/20 px-2 py-1 text-[0.6875rem] text-white/35">Skills appear here</span>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs">
            <FileText className={cn("size-4 shrink-0", file ? "text-teal-300" : "text-white/30")} aria-hidden />
            <span className={cn("truncate", file ? "text-white/85" : "text-white/35")}>{file ? file.name : "Resume not attached yet"}</span>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[0.6875rem] text-white/50">
              <span>{sent ? "Sent" : "Profile"}</span>
              <span className="font-mono">{sent ? "100" : pct}%</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-sky-400" initial={false} animate={{ width: `${sent ? 100 : pct}%` }} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {sent && (
            <motion.span
              initial={{ scale: 2, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -12 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="absolute right-5 top-16 rounded-lg border-2 border-teal-300 px-3 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-teal-300"
            >
              Received
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function Row({ icon: Icon, on, children }: { icon: typeof MapPin; on: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={cn("size-3.5 shrink-0", on ? "text-teal-300" : "text-white/25")} aria-hidden />
      <span className={cn("truncate", on ? "text-white/80" : "text-white/30")}>{children}</span>
    </div>
  );
}
