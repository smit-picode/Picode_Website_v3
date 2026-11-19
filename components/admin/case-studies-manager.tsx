"use client";

/* eslint-disable @next/next/no-img-element -- previews of uploaded / picked files */

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useFormState } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteCaseStudyAction,
  moveCaseStudyAction,
  saveCaseStudyAction,
  setCaseStudyPublishedAction,
  type FormState,
} from "@/app/admin/actions";
import { SavedToast, SaveButton } from "@/components/admin/form-bits";
import { DeviceStage, ProjectMark } from "@/components/case-studies/devices";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { CaseStudy, PreviewKind } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

const EMPTY: CaseStudy = {
  id: "",
  name: "",
  category: "",
  headline: "",
  headlineAccent: "",
  summary: "",
  services: [{ title: "", description: "" }],
  accent: "#0D9488",
  preview: "both",
  url: "",
  logo: "",
  desktopImage: "",
  mobileImage: "",
  published: true,
  order: 0,
};

export function CaseStudiesManager({ studies }: { studies: CaseStudy[] }) {
  const [editing, setEditing] = useState<CaseStudy | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Shown on the home page in this order, after the tech stack. Projects without screenshots get a branded preview.
        </p>
        <Button leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing("new")}>
          Add case study
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {editing && (
          <motion.div
            key={editing === "new" ? "new" : editing.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CaseStudyForm study={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", pending && "opacity-70 transition-opacity")}>
        {studies.map((s, i) => (
          <article
            key={s.id}
            className={cn(
              "group overflow-hidden rounded-2xl border border-gray-100 bg-surface shadow-soft",
              !s.published && "opacity-75",
            )}
          >
            <div
              className="relative overflow-hidden px-6 pt-5"
              style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${s.accent} 22%, transparent), transparent 80%)` }}
            >
              <DeviceStage study={s} className="pointer-events-none" />
              {!s.published && (
                <span className="absolute left-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
                  Hidden
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ProjectMark study={s} className="text-[0.9375rem] text-gray-900" />
                  <p className="mt-1 truncate text-xs text-gray-500">{s.category}</p>
                </div>
                <span className="font-display text-xs tabular-nums text-gray-400">#{i + 1}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-gray-600">{s.summary}</p>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <IconButton label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton
                  label={s.published ? `Hide ${s.name} from the site` : `Show ${s.name} on the site`}
                  onClick={() => startTransition(() => setCaseStudyPublishedAction(s.id, !s.published))}
                >
                  {s.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </IconButton>
                <IconButton
                  label="Move earlier"
                  disabled={i === 0}
                  onClick={() => startTransition(() => moveCaseStudyAction(s.id, -1))}
                >
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton
                  label="Move later"
                  disabled={i === studies.length - 1}
                  onClick={() => startTransition(() => moveCaseStudyAction(s.id, 1))}
                >
                  <ArrowDown className="size-4" />
                </IconButton>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${s.name} live site`}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <span className="flex-1" />
                <IconButton label={`Delete ${s.name}`} danger onClick={() => setConfirmId(s.id)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>

              {confirmId === s.id && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">
                  Delete {s.name} and its images?
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmId(null);
                      startTransition(() => deleteCaseStudyAction(s.id));
                    }}
                    className="rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white"
                  >
                    Delete
                  </button>
                  <button type="button" onClick={() => setConfirmId(null)} className="text-xs font-medium">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {studies.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
          No case studies yet. Add your first one; the section is hidden on the site until then.
        </p>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-35",
        danger && "hover:border-danger/40 hover:bg-transparent hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Editor                                                               */
/* ------------------------------------------------------------------ */

type ImageKey = "logo" | "desktopImage" | "mobileImage";

function readDraft(form: HTMLFormElement, base: CaseStudy, images: Record<ImageKey, string>): CaseStudy {
  const fd = new FormData(form);
  const t = (k: string) => String(fd.get(k) ?? "");
  return {
    ...base,
    name: t("name") || "Project",
    category: t("category") || "Category",
    headline: t("headline") || "Headline",
    headlineAccent: t("headlineAccent"),
    summary: t("summary"),
    services: [0, 1, 2]
      .map((i) => ({ title: t(`service${i}Title`), description: t(`service${i}Description`) }))
      .filter((s) => s.title || s.description),
    accent: /^#[0-9a-f]{6}$/i.test(t("accent")) ? t("accent") : base.accent,
    preview: (t("preview") || "both") as PreviewKind,
    url: t("url"),
    ...images,
  };
}

function CaseStudyForm({ study, onClose }: { study: CaseStudy | null; onClose: () => void }) {
  const [state, action] = useFormState<FormState, FormData>(saveCaseStudyAction, {});
  const e = state.fieldErrors ?? {};
  const base = study ?? EMPTY;
  const formRef = useRef<HTMLFormElement>(null);

  const [accent, setAccent] = useState(base.accent);
  const [serviceCount, setServiceCount] = useState(Math.max(1, base.services.length));
  const [images, setImages] = useState<Record<ImageKey, string>>({
    logo: base.logo,
    desktopImage: base.desktopImage,
    mobileImage: base.mobileImage,
  });
  const [draft, setDraft] = useState<CaseStudy>(base);

  const refresh = () => {
    if (formRef.current) setDraft(readDraft(formRef.current, base, images));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, [images, accent, serviceCount]);

  // Bring the editor into view (it opens above the list, often off-screen).
  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Close the editor shortly after a successful save.
  useEffect(() => {
    if (!state.ok) return;
    const t = window.setTimeout(onClose, 900);
    return () => window.clearTimeout(t);
  }, [state, onClose]);

  return (
    <form
      ref={formRef}
      action={action}
      onChange={(ev: FormEvent<HTMLFormElement>) => {
        if ((ev.target as HTMLInputElement).type !== "file") refresh();
      }}
      noValidate
      className="scroll-mt-32 rounded-2xl border border-primary/30 bg-surface p-6 shadow-float sm:p-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-h3">{study ? `Edit ${study.name}` : "New case study"}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="size-4" />
        </button>
      </div>

      <input type="hidden" name="id" value={study?.id ?? ""} />

      <div className="grid gap-8 xl:grid-cols-[1fr_26rem]">
        {/* Fields */}
        <div className="space-y-8">
          <fieldset className="grid gap-5 sm:grid-cols-6">
            <legend className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Project</legend>
            <Input name="name" label="Project name" placeholder="Breakbread" defaultValue={study?.name} error={e.name} wrapperClassName="sm:col-span-3" />
            <Input
              name="category"
              label="Category"
              placeholder="Marketplace · Web & mobile"
              defaultValue={study?.category}
              error={e.category}
              wrapperClassName="sm:col-span-3"
            />
            <Input
              name="headline"
              label="Headline"
              placeholder="Make it"
              defaultValue={study?.headline}
              error={e.headline}
              hint="First line, dark"
              wrapperClassName="sm:col-span-3"
            />
            <Input
              name="headlineAccent"
              label="Headline accent"
              placeholder="a moment."
              defaultValue={study?.headlineAccent}
              error={e.headlineAccent}
              hint="Second line, in the brand colour"
              wrapperClassName="sm:col-span-3"
            />
            <Textarea
              name="summary"
              label="Summary"
              rows={3}
              placeholder="What the product is and who it's for."
              defaultValue={study?.summary}
              error={e.summary}
              wrapperClassName="sm:col-span-6"
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
              What we did <span className="normal-case tracking-normal">(the first two are shown on the site)</span>
            </legend>
            {e.services && <p className="text-xs font-medium text-danger">{e.services}</p>}
            {Array.from({ length: serviceCount }, (_, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-[14rem_1fr]">
                <Input
                  name={`service${i}Title`}
                  label={`Service ${i + 1}`}
                  placeholder="Custom Shopify Frontend"
                  defaultValue={study?.services[i]?.title}
                  error={e[`service${i}`]}
                />
                <Textarea
                  name={`service${i}Description`}
                  label="Description"
                  rows={2}
                  placeholder="One or two sentences about the outcome."
                  defaultValue={study?.services[i]?.description}
                />
              </div>
            ))}
            <div className="flex gap-2">
              {serviceCount < 3 && (
                <Button variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setServiceCount((n) => n + 1)}>
                  Add service
                </Button>
              )}
              {serviceCount > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setServiceCount((n) => n - 1)}>
                  Remove last
                </Button>
              )}
            </div>
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-6">
            <legend className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Look & links</legend>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="accent" className="block font-display text-sm font-semibold text-gray-800">
                Brand colour
              </label>
              <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2">
                <input
                  type="color"
                  aria-label="Pick brand colour"
                  value={accent}
                  onChange={(ev) => setAccent(ev.target.value)}
                  className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <input
                  id="accent"
                  name="accent"
                  value={accent}
                  onChange={(ev) => setAccent(ev.target.value)}
                  maxLength={7}
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase text-gray-900 outline-none"
                />
              </div>
              {e.accent && <p className="text-xs font-medium text-danger">{e.accent}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="preview" className="block font-display text-sm font-semibold text-gray-800">
                Devices shown
              </label>
              <select
                id="preview"
                name="preview"
                defaultValue={base.preview}
                className="block h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-[0.9375rem] text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="both">Website + phone</option>
                <option value="web">Website only</option>
                <option value="mobile">Phones only</option>
              </select>
            </div>
            <Input
              name="url"
              type="url"
              label="Live URL (optional)"
              placeholder="https://example.com"
              defaultValue={study?.url}
              error={e.url}
              wrapperClassName="sm:col-span-2"
            />
            <label className="flex items-center gap-3 text-sm font-medium text-gray-800 sm:col-span-6">
              <input
                type="checkbox"
                name="published"
                defaultChecked={base.published}
                className="size-4 rounded border-gray-300 accent-[rgb(45_212_191)]"
              />
              Show on the website
            </label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Images</legend>
            <ImageField
              field="desktopImage"
              label="Website screenshot"
              hint="Full-page, 1440px+ wide. Taller images scroll in the browser frame."
              current={images.desktopImage}
              onChange={(v) => setImages((m) => ({ ...m, desktopImage: v }))}
            />
            <ImageField
              field="mobileImage"
              label="App screenshot"
              hint="Phone screen, ~1170×2532 or taller."
              current={images.mobileImage}
              onChange={(v) => setImages((m) => ({ ...m, mobileImage: v }))}
            />
            <ImageField
              field="logo"
              label="Logo"
              hint="Transparent PNG/WebP, wide format."
              current={images.logo}
              onChange={(v) => setImages((m) => ({ ...m, logo: v }))}
              contain
            />
          </fieldset>
        </div>

        {/* Live preview */}
        <div className="xl:sticky xl:top-36 xl:self-start">
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Live preview</p>
          <div
            className="overflow-hidden rounded-2xl border border-gray-100 p-5"
            style={{
              background: `radial-gradient(80% 60% at 80% 100%, color-mix(in oklab, ${draft.accent} 30%, transparent), transparent 70%), rgb(var(--color-surface-muted))`,
              ["--accent" as string]: draft.accent,
            }}
          >
            <DeviceStage study={draft} />
            <p className="text-accent-brand mt-3 font-display text-[0.625rem] font-semibold uppercase tracking-[0.18em]">{draft.category}</p>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-gray-900">
              {draft.headline}
              {draft.headlineAccent && (
                <>
                  <br />
                  <span className="text-accent-brand">{draft.headlineAccent}</span>
                </>
              )}
            </p>
            <p className="mt-2 line-clamp-3 text-xs text-gray-500">{draft.summary}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {state.error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 flex items-center gap-2 overflow-hidden rounded-xl bg-danger/[0.08] px-4 py-3 text-sm text-danger"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden /> {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SaveButton label={study ? "Save case study" : "Add case study"} />
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <SavedToast message={state.ok ? state.message : undefined} stamp={state} />
      </div>
    </form>
  );
}

function ImageField({
  field,
  label,
  hint,
  current,
  onChange,
  contain,
}: {
  field: ImageKey;
  label: string;
  hint: string;
  current: string;
  onChange: (src: string) => void;
  contain?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => void (objectUrl.current && URL.revokeObjectURL(objectUrl.current)), []);

  const pick = (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    setError(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Max 8 MB.");
      ev.target.value = "";
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setRemoved(false);
    onChange(objectUrl.current);
  };

  const remove = () => {
    if (inputRef.current) inputRef.current.value = "";
    setRemoved(true);
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <p className="font-display text-sm font-semibold text-gray-800">{label}</p>
      <div className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
        {current ? (
          <img
            src={current}
            alt=""
            className={cn("size-full", contain ? "object-contain p-4" : "object-cover object-top")}
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            <ImagePlus className="size-6" aria-hidden />
            Upload
          </button>
        )}
        {current && (
          <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 rounded-lg bg-white/95 px-2 py-1.5 text-xs font-semibold text-gray-900 shadow"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={remove}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="rounded-lg bg-white/95 px-2 py-1.5 text-xs font-semibold text-danger shadow"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" name={`${field}File`} accept={ACCEPT} onChange={pick} className="sr-only" tabIndex={-1} />
      <input type="hidden" name={`${field}Remove`} value={removed ? "1" : ""} />
      <p className={cn("text-xs", error ? "font-medium text-danger" : "text-gray-500")}>{error ?? hint}</p>
    </div>
  );
}
