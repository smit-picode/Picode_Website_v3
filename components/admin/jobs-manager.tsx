"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Briefcase, ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import {
  deleteJobAction,
  moveJobAction,
  saveJobAction,
  setJobPublishedAction,
  type FormState,
} from "@/app/admin/actions";
import { SavedToast, SaveButton } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { EMPLOYMENT_TYPES, type JobPost } from "@/lib/content/careers";
import { cn } from "@/lib/utils";

export function JobsManager({ jobs, applicationCounts }: { jobs: JobPost[]; applicationCounts: Record<string, number> }) {
  const [editing, setEditing] = useState<JobPost | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {jobs.filter((j) => j.published).length} live · {jobs.filter((j) => !j.published).length} hidden
        </p>
        <Button onClick={() => setEditing("new")} leftIcon={<Plus className="size-4" aria-hidden />}>
          New job post
        </Button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <JobForm key={editing === "new" ? "new" : editing.id} job={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-surface p-10 text-center">
          <Briefcase className="mx-auto size-8 text-gray-300" aria-hidden />
          <p className="mt-3 font-semibold text-gray-900">No job posts yet</p>
          <p className="mt-1 text-sm text-gray-500">The careers page shows a friendly empty state and the talent-pool form until you add one.</p>
        </div>
      ) : (
        <ul className={cn("divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-surface shadow-soft", pending && "opacity-70")}>
          {jobs.map((j, i) => (
            <li key={j.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-gray-900">{j.title}</h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                      j.published ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {j.published ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {j.team} · {j.location} · {j.employmentType}
                  {j.experience ? ` · ${j.experience}` : ""}
                </p>
                <a
                  href={`/admin?tab=applications&job=${encodeURIComponent(j.id)}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary-strong hover:underline"
                >
                  <Users className="size-3.5" aria-hidden /> {applicationCounts[j.id] ?? 0} applications
                </a>
              </div>
              <div className="flex items-center gap-1">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => startTransition(() => moveJobAction(j.id, -1))}>
                  <ArrowUp className="size-4" />
                </IconBtn>
                <IconBtn label="Move down" disabled={i === jobs.length - 1} onClick={() => startTransition(() => moveJobAction(j.id, 1))}>
                  <ArrowDown className="size-4" />
                </IconBtn>
                <IconBtn label={j.published ? "Hide from site" : "Publish"} onClick={() => startTransition(() => setJobPublishedAction(j.id, !j.published))}>
                  {j.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </IconBtn>
                {j.published && (
                  <a
                    href={`/careers/${j.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-label="View on site"
                    title="View on site"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <IconBtn label="Edit" onClick={() => setEditing(j)}>
                  <Pencil className="size-4" />
                </IconBtn>
                {confirmId === j.id ? (
                  <span className="ml-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmId(null);
                        startTransition(() => deleteJobAction(j.id));
                      }}
                      className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Delete
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <IconBtn label="Delete" danger onClick={() => setConfirmId(j.id)}>
                    <Trash2 className="size-4" />
                  </IconBtn>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">Deleting a post keeps its applications (they stay listed under the role they applied for).</p>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors disabled:opacity-30",
        danger ? "hover:bg-danger/10 hover:text-danger" : "hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {children}
    </button>
  );
}

function JobForm({ job, onClose }: { job: JobPost | null; onClose: () => void }) {
  const [state, action] = useFormState<FormState, FormData>(saveJobAction, {});
  const e = state.fieldErrors ?? {};

  // Close a new-post form once it's saved (edits stay open for more tweaks).
  useEffect(() => {
    if (state.ok && !job) {
      const t = window.setTimeout(onClose, 900);
      return () => window.clearTimeout(t);
    }
  }, [state, job, onClose]);

  return (
    <form action={action} noValidate className="rounded-2xl border border-primary/25 bg-surface p-6 shadow-soft sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-gray-900">{job ? `Edit: ${job.title}` : "New job post"}</h2>
          <p className="mt-1 text-sm text-gray-500">Lists take one item per line. Skills are comma-separated.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>

      <input type="hidden" name="originalId" value={job?.id ?? ""} />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Input name="title" label="Job title" defaultValue={job?.title} placeholder="Senior Backend Engineer" error={e.title} />
        <Input
          name="id"
          label="Page link"
          defaultValue={job?.id}
          placeholder="Auto from the title"
          hint="careers/<this>. Lowercase letters, numbers and dashes."
          error={e.id}
        />
        <Input name="team" label="Team" defaultValue={job?.team} placeholder="Engineering" error={e.team} />
        <Input name="location" label="Location" defaultValue={job?.location} placeholder="Bengaluru / Hybrid" error={e.location} />
        <Input
          name="employmentType"
          label="Employment type"
          list="job-types"
          defaultValue={job?.employmentType ?? "Full-time"}
          error={e.employmentType}
        />
        <datalist id="job-types">
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <Input name="experience" label="Experience" defaultValue={job?.experience} placeholder="3+ years" error={e.experience} />
        <Input
          name="summary"
          label="One-line summary"
          defaultValue={job?.summary}
          placeholder="Shown on the job card"
          error={e.summary}
          wrapperClassName="sm:col-span-2"
        />
        <Textarea name="about" label="About the role" defaultValue={job?.about} rows={4} error={e.about} wrapperClassName="sm:col-span-2" />
        <Textarea
          name="responsibilities"
          label="What you'll do"
          defaultValue={job?.responsibilities.join("\n")}
          rows={5}
          hint="One per line"
          error={e.responsibilities}
        />
        <Textarea
          name="requirements"
          label="What we're looking for"
          defaultValue={job?.requirements.join("\n")}
          rows={5}
          hint="One per line"
          error={e.requirements}
        />
        <Textarea name="niceToHave" label="Nice to have" defaultValue={job?.niceToHave.join("\n")} rows={3} hint="One per line" error={e.niceToHave} />
        <Textarea
          name="skills"
          label="Skills"
          defaultValue={job?.skills.join(", ")}
          rows={3}
          hint="Comma-separated. Shown on the post and suggested in the apply form."
          error={e.skills}
        />
      </div>

      <label className="mt-6 flex items-center gap-3 text-sm font-medium text-gray-800">
        <input type="checkbox" name="published" defaultChecked={job ? job.published : true} className="size-4 accent-[rgb(var(--color-primary))]" />
        Show on the careers page
      </label>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SaveButton label={job ? "Save changes" : "Publish job"} />
        <button type="button" onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-900">
          Cancel
        </button>
        <SavedToast message={state.ok ? state.message : undefined} stamp={state} />
      </div>
    </form>
  );
}
