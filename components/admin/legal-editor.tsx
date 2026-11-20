"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { resetLegalContentAction, saveLegalContentAction, type ServicesSaveState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { LegalDocument } from "@/lib/content/legal";
import { LEGAL_KEYS, LEGAL_LABEL, LEGAL_PATH, type LegalKey } from "@/lib/content/legal-schema";
import { cn } from "@/lib/utils";

/* Editor state: a block is a paragraph, or a bullet list edited one item per line. */
type EBlock = { kind: "p" | "list"; text: string };
type ESection = { id: string; title: string; body: EBlock[] };
type EDoc = Omit<LegalDocument, "sections"> & { sections: ESection[] };

const toEditor = (d: LegalDocument): EDoc => ({
  ...d,
  highlights: d.highlights.map((h) => ({ ...h })),
  sections: d.sections.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body.map((b): EBlock => (typeof b === "string" ? { kind: "p", text: b } : { kind: "list", text: b.list.join("\n") })),
  })),
});

/** Trim and drop empty paragraphs / list lines before saving. */
function toDocument(d: EDoc): LegalDocument {
  // Section ids (the #anchor links) are managed automatically: existing sections keep theirs
  // so old links never break; new ones are made from the title and kept unique.
  const used = new Set(d.sections.map((s) => s.id).filter(Boolean));
  const idFor = (s: ESection) => {
    if (s.id) return s.id;
    const base = slug(s.title) || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
  return {
    ...d,
    highlights: d.highlights.filter((h) => h.title.trim() || h.text.trim()),
    sections: d.sections.map((s) => ({
      id: idFor(s),
      title: s.title,
      body: s.body.flatMap((b): LegalDocument["sections"][number]["body"] => {
        if (b.kind === "p") return b.text.trim() ? [b.text.trim()] : [];
        const list = b.text.split("\n").map((x) => x.trim()).filter(Boolean);
        return list.length ? [{ list }] : [];
      }),
    })),
  };
}

const today = () => new Date().toISOString().slice(0, 10);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ---------- small helpers (kept local so other admin editors stay untouched) ---------- */

const inputCls =
  "block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={cn("block space-y-1", wide && "sm:col-span-2")}>
      <span className="block text-xs font-semibold text-gray-700">{label}</span>
      {children}
      {hint && <span className="block text-[0.6875rem] text-gray-400">{hint}</span>}
    </label>
  );
}

function move<T>(list: T[], i: number, d: -1 | 1) {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}
const setAt = <T,>(list: T[], i: number, item: T) => list.map((x, k) => (k === i ? item : x));

function IconBtn({ onClick, disabled, label, danger, children }: { onClick: () => void; disabled?: boolean; label: string; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn("rounded-lg p-2 text-gray-500 disabled:opacity-30", danger ? "hover:bg-danger/10 hover:text-danger" : "hover:bg-gray-100")}
    >
      {children}
    </button>
  );
}

function SectionCard({
  index,
  count,
  section,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  section: ESection;
  onChange: (s: ESection) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const setBlock = (i: number, b: EBlock) => onChange({ ...section, body: setAt(section.body, i, b) });

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface shadow-soft">
      <div className="flex items-center gap-2 p-4">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
          <ChevronDown className={cn("size-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} aria-hidden />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-gray-900">
              <span className="mr-2 font-mono text-xs font-normal text-gray-400">{String(index + 1).padStart(2, "0")}</span>
              {section.title || "Untitled section"}
            </span>
          </span>
        </button>
        <IconBtn onClick={() => onMove(-1)} disabled={index === 0} label="Move up">
          <ArrowUp className="size-4" />
        </IconBtn>
        <IconBtn onClick={() => onMove(1)} disabled={index === count - 1} label="Move down">
          <ArrowDown className="size-4" />
        </IconBtn>
        {confirm ? (
          <span className="flex items-center gap-1">
            <button type="button" onClick={onRemove} className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-semibold text-white">
              Delete
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
          </span>
        ) : (
          count > 1 && (
            <IconBtn onClick={() => setConfirm(true)} label="Delete section" danger>
              <Trash2 className="size-4" />
            </IconBtn>
          )
        )}
      </div>

      {open && (
        <div className="space-y-4 border-t border-gray-100 p-4 sm:p-5">
          <Field label="Section title">
            <input className={inputCls} value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
          </Field>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-gray-700">Content</span>
            {section.body.map((b, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Block type"
                      className={cn(inputCls, "w-auto py-1.5 text-xs")}
                      value={b.kind}
                      onChange={(e) => setBlock(i, { ...b, kind: e.target.value as EBlock["kind"] })}
                    >
                      <option value="p">Paragraph</option>
                      <option value="list">Bullet list</option>
                    </select>
                    {b.kind === "list" && <span className="text-[0.6875rem] text-gray-400">One bullet per line</span>}
                  </div>
                  <textarea
                    className={cn(inputCls, "resize-y")}
                    rows={b.kind === "list" ? 5 : 4}
                    value={b.text}
                    onChange={(e) => setBlock(i, { ...b, text: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <button type="button" onClick={() => onChange({ ...section, body: move(section.body, i, -1) })} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move block up">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => onChange({ ...section, body: move(section.body, i, 1) })} disabled={i === section.body.length - 1} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move block down">
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => onChange({ ...section, body: section.body.filter((_, k) => k !== i) })} className="rounded p-1 text-gray-400 hover:text-danger" aria-label="Remove block">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-4">
              <button type="button" onClick={() => onChange({ ...section, body: [...section.body, { kind: "p", text: "" }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-strong hover:underline">
                <Plus className="size-3.5" aria-hidden /> Add paragraph
              </button>
              <button type="button" onClick={() => onChange({ ...section, body: [...section.body, { kind: "list", text: "" }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-strong hover:underline">
                <Plus className="size-3.5" aria-hidden /> Add bullet list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocEditor({ docKey, initial }: { docKey: LegalKey; initial: LegalDocument }) {
  const [d, setD] = useState<EDoc>(() => toEditor(initial));
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<ServicesSaveState>({});
  const [pending, start] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);
  const dateTouched = useRef(false);

  const update = (patch: Partial<EDoc>) => {
    setD((p) => ({ ...p, ...patch }));
    setDirty(true);
    setState({});
  };

  const save = () =>
    start(async () => {
      // Unless the date was set by hand, stamp the save date as "Last updated".
      const doc = toDocument(dateTouched.current ? d : { ...d, updated: today() });
      const r = await saveLegalContentAction(docKey, JSON.stringify(doc));
      setState(r);
      if (r.ok) {
        setD(toEditor(doc));
        setDirty(false);
        dateTouched.current = false;
      }
    });

  const reset = () =>
    start(async () => {
      const r = await resetLegalContentAction(docKey);
      setState(r);
      setConfirmReset(false);
      if (r.ok) window.location.reload();
    });

  return (
    <div className="space-y-6">
      <div className="sticky top-[7.5rem] z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-surface/95 p-3 shadow-soft backdrop-blur">
        <p className="px-1 text-sm text-gray-500">
          {d.sections.length} sections · last updated <span className="font-medium text-gray-700">{d.updated}</span>
        </p>
        <div className="ml-auto flex items-center gap-2">
          <a href={LEGAL_PATH[docKey]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            View page <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <Button onClick={save} disabled={pending || !dirty} leftIcon={pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}>
            {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>

      {(state.error || state.message) && (
        <div role="status" className={cn("rounded-xl border p-4 text-sm", state.ok ? "border-success/30 bg-success/[0.05] text-success" : "border-danger/30 bg-danger/[0.05] text-danger")}>
          {state.error ?? state.message}
          {state.issues && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
              {state.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Header */}
      <div className="grid gap-4 rounded-2xl border border-gray-100 bg-surface p-5 shadow-soft sm:grid-cols-2">
        <Field label="Title">
          <input className={inputCls} value={d.title} onChange={(e) => update({ title: e.target.value })} />
        </Field>
        <Field label="Eyebrow" hint="Small label above the title">
          <input className={inputCls} value={d.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} />
        </Field>
        <Field label="Summary" wide>
          <textarea className={cn(inputCls, "resize-y")} rows={3} value={d.summary} onChange={(e) => update({ summary: e.target.value })} />
        </Field>
        <Field label="Last updated" hint="Set automatically to today's date when you save, unless you change it here.">
          <input
            type="date"
            className={inputCls}
            value={d.updated}
            onChange={(e) => {
              dateTouched.current = true;
              update({ updated: e.target.value });
            }}
          />
        </Field>
      </div>

      {/* Highlights */}
      <div className="space-y-2 rounded-2xl border border-gray-100 bg-surface p-5 shadow-soft">
        <p className="text-sm font-semibold text-gray-900">At a glance</p>
        <p className="text-xs text-gray-500">Short cards shown above the full text (up to 6).</p>
        {d.highlights.map((h, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
              <input className={inputCls} placeholder="Title" value={h.title} onChange={(e) => update({ highlights: setAt(d.highlights, i, { ...h, title: e.target.value }) })} />
              <textarea className={cn(inputCls, "resize-y")} rows={2} placeholder="Text" value={h.text} onChange={(e) => update({ highlights: setAt(d.highlights, i, { ...h, text: e.target.value }) })} />
            </div>
            <div className="flex flex-col">
              <button type="button" onClick={() => update({ highlights: move(d.highlights, i, -1) })} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move up">
                <ArrowUp className="size-3.5" />
              </button>
              <button type="button" onClick={() => update({ highlights: move(d.highlights, i, 1) })} disabled={i === d.highlights.length - 1} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move down">
                <ArrowDown className="size-3.5" />
              </button>
              <button type="button" onClick={() => update({ highlights: d.highlights.filter((_, k) => k !== i) })} className="rounded p-1 text-gray-400 hover:text-danger" aria-label="Remove">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {d.highlights.length < 6 && (
          <button type="button" onClick={() => update({ highlights: [...d.highlights, { title: "", text: "" }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-strong hover:underline">
            <Plus className="size-3.5" aria-hidden /> Add
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Sections</p>
          <p className="text-xs text-gray-500">
            Use <code>{"{email}"}</code> for the contact email link and <code>{"{address}"}</code> for the headquarters address. Both are filled in on the page automatically.
          </p>
        </div>
        {d.sections.map((s, i) => (
          <SectionCard
            key={i}
            index={i}
            count={d.sections.length}
            section={s}
            onChange={(next) => update({ sections: setAt(d.sections, i, next) })}
            onMove={(dir) => update({ sections: move(d.sections, i, dir) })}
            onRemove={() => update({ sections: d.sections.filter((_, k) => k !== i) })}
          />
        ))}
        {d.sections.length < 30 && (
          <button
            type="button"
            onClick={() => update({ sections: [...d.sections, { id: "", title: "New section", body: [{ kind: "p", text: "" }] }] })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong hover:underline"
          >
            <Plus className="size-4" aria-hidden /> Add section
          </button>
        )}
      </div>

      {/* Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-200 p-4">
        <p className="text-sm text-gray-500">Want the original text back? This replaces everything above with the built-in {LEGAL_LABEL[docKey]}.</p>
        {confirmReset ? (
          <span className="flex items-center gap-2">
            <button type="button" onClick={reset} disabled={pending} className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white">
              Yes, restore original
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            <RotateCcw className="size-4" aria-hidden /> Restore original
          </button>
        )}
      </div>
    </div>
  );
}

export function LegalEditor({ docs }: { docs: Record<LegalKey, LegalDocument> }) {
  const [tab, setTab] = useState<LegalKey>("privacy");
  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        {LEGAL_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", tab === k ? "bg-gradient-primary text-white shadow-soft" : "text-gray-600 hover:bg-gray-100")}
          >
            {LEGAL_LABEL[k]}
          </button>
        ))}
      </div>
      {/* Keyed so each page keeps its own unsaved edits when switching tabs. */}
      {LEGAL_KEYS.map((k) => (
        <div key={k} hidden={tab !== k}>
          <DocEditor docKey={k} initial={docs[k]} />
        </div>
      ))}
    </div>
  );
}
