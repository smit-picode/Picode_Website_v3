"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Briefcase, Check, Clock, Copy, MapPin, Plus } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { buttonClasses } from "@/components/ui/button";
import type { Job } from "@/lib/content/company";

/**
 * /careers open roles. Clicking a row expands the role's full details in place
 * (one open at a time); "Apply" inside offers Gmail / Outlook / mail app / copy.
 * Each role is deep-linkable via /careers#job-<id>.
 */
export function JobList({ jobs, careersEmail }: { jobs: Job[]; careersEmail: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  // Open the role named in the URL hash (e.g. a shared link).
  useEffect(() => {
    const id = window.location.hash.replace(/^#job-/, "");
    if (jobs.some((j) => j.id === id)) setOpenId(id);
  }, [jobs]);

  const toggle = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    const url = next ? `#job-${next}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="mt-12 divide-y divide-gray-200/70 border-y border-gray-200/70">
      {jobs.map((j, i) => {
        const open = openId === j.id;
        return (
          <Reveal key={j.id} delay={i * 0.05}>
            <div id={`job-${j.id}`} className="scroll-mt-28">
              <button
                type="button"
                onClick={() => toggle(j.id)}
                aria-expanded={open}
                aria-controls={`job-panel-${j.id}`}
                className="group grid w-full items-center gap-4 py-8 text-left transition-colors sm:grid-cols-12"
              >
                <div className="sm:col-span-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-secondary-strong">{j.team}</p>
                  <h3
                    className={`mt-2 font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-secondary-strong ${open ? "text-secondary-strong" : ""}`}
                  >
                    {j.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{j.summary}</p>
                </div>
                <p className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-3">
                  <MapPin className="size-4 text-gray-400" aria-hidden /> {j.location}
                </p>
                <div className="flex items-center justify-between gap-4 sm:col-span-3 sm:justify-end">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{j.type}</span>
                  <span
                    className={`inline-flex size-11 items-center justify-center rounded-full border transition-all duration-300 ${
                      open
                        ? "border-transparent bg-gradient-primary text-white"
                        : "border-gray-200 group-hover:border-transparent group-hover:bg-gradient-primary group-hover:text-white"
                    }`}
                  >
                    <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: reduce ? 0 : 0.3 }} className="inline-flex">
                      <Plus className="size-5" aria-hidden />
                    </motion.span>
                    <span className="sr-only">{open ? "Hide details" : "Show details"}</span>
                  </span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`job-panel-${j.id}`}
                    role="region"
                    aria-label={`${j.title} details`}
                    initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <JobDetails job={j} email={careersEmail} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

function JobDetails({ job, email }: { job: Job; email: string }) {
  const lists: { title: string; items?: string[] }[] = [
    { title: "What you'll do", items: job.responsibilities },
    { title: "What we're looking for", items: job.requirements },
    { title: "Nice to have", items: job.niceToHave },
  ];
  return (
    <div className="mb-8 rounded-[1.5rem] border border-gray-200/70 bg-surface-muted/60 p-6 sm:p-8">
      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <Meta icon={<Briefcase className="size-3.5" aria-hidden />}>{job.team}</Meta>
        <Meta icon={<MapPin className="size-3.5" aria-hidden />}>{job.location}</Meta>
        <Meta icon={<Clock className="size-3.5" aria-hidden />}>{job.type}</Meta>
        {job.experience && <Meta icon={<ArrowUpRight className="size-3.5" aria-hidden />}>{job.experience} experience</Meta>}
      </div>

      {job.about && <p className="mt-5 max-w-3xl text-body-md text-gray-700">{job.about}</p>}

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {lists
          .filter((l) => l.items?.length)
          .map((l) => (
            <div key={l.title}>
              <h4 className="font-display text-base font-semibold">{l.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {l.items!.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-gray-600">
                    <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-gradient-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-gray-200/70 pt-6">
        <ApplyMenu job={job} email={email} />
        <p className="text-sm text-gray-500">
          Send your CV and a short note to <span className="font-medium text-gray-700">{email}</span>.
        </p>
      </div>
    </div>
  );
}

/**
 * A bare mailto: link does nothing in browsers with no default mail app
 * (common on Windows), so "Apply" offers webmail, the mail app and copy.
 */
function ApplyMenu({ job, email }: { job: Job; email: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const subject = `Application: ${job.title}`;
  const body = `Hi Picode team,\n\nI'd like to apply for the ${job.title} role. My CV is attached.\n\n`;
  const q = (s: string) => encodeURIComponent(s);
  const options = [
    { label: "Gmail", href: `https://mail.google.com/mail/?view=cm&fs=1&to=${q(email)}&su=${q(subject)}&body=${q(body)}`, external: true },
    { label: "Outlook", href: `https://outlook.office.com/mail/deeplink/compose?to=${q(email)}&subject=${q(subject)}&body=${q(body)}`, external: true },
    { label: "Default email app", href: `mailto:${email}?subject=${q(subject)}&body=${q(body)}`, external: false },
  ];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this email address:", email);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClasses({ variant: "primary" })}
      >
        Apply for this role <ArrowUpRight className="size-4" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-0 z-20 mb-2 w-60 overflow-hidden rounded-2xl border border-gray-200/70 bg-surface p-1.5 shadow-xl"
          >
            <p className="px-3 pb-1 pt-2 text-xs font-medium text-gray-400">Apply by email with</p>
            {options.map((o) => (
              <a
                key={o.label}
                role="menuitem"
                href={o.href}
                {...(o.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-surface-muted hover:text-secondary-strong"
              >
                {o.label}
                <ArrowUpRight className="size-3.5 opacity-50" aria-hidden />
              </a>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={copy}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-surface-muted hover:text-secondary-strong"
            >
              {copied ? "Copied!" : "Copy email address"}
              {copied ? <Check className="size-3.5 text-secondary" aria-hidden /> : <Copy className="size-3.5 opacity-50" aria-hidden />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-surface px-3 py-1">
      {icon}
      {children}
    </span>
  );
}
