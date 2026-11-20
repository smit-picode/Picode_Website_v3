"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { resetServicesContentAction, saveServicesContentAction, type ServicesSaveState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ICON_NAMES, iconByName } from "@/lib/content/icon-registry";
import type { EngagementDoc, FaqDoc, IndustryDoc, ServiceDoc, ServicesContent } from "@/lib/content/services-content";
import { cn } from "@/lib/utils";

type Tab = "services" | "industries" | "engagements" | "faqs";
const TABS: { id: Tab; label: string }[] = [
  { id: "services", label: "Services" },
  { id: "industries", label: "Industries" },
  { id: "engagements", label: "Engagement models" },
  { id: "faqs", label: "FAQs" },
];

/* ---------- small generic helpers ---------- */

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

function Text({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function Area({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className={cn(inputCls, "resize-y")} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />;
}

/** A string[] edited as one item per line (empty lines are dropped on save). */
function Lines({ value, onChange, rows = 4 }: { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  return <Area rows={rows} value={value.join("\n")} onChange={(v) => onChange(v.split("\n"))} />;
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const Icon = iconByName(value);
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
        <Icon className="size-4" aria-hidden />
      </span>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Icon">
        {ICON_NAMES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
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

/** Collapsible card for one item, with reorder / delete. */
function ItemCard({
  title,
  subtitle,
  index,
  count,
  onMove,
  onRemove,
  children,
  defaultOpen,
}: {
  title: string;
  subtitle?: string;
  index: number;
  count: number;
  onMove: (d: -1 | 1) => void;
  onRemove?: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 bg-surface shadow-soft">
      <div className="flex items-center gap-2 p-4">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
          <ChevronDown className={cn("size-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} aria-hidden />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-gray-900">{title || "Untitled"}</span>
            {subtitle && <span className="block truncate text-xs text-gray-500">{subtitle}</span>}
          </span>
        </button>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Move up">
          <ArrowUp className="size-4" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Move down">
          <ArrowDown className="size-4" />
        </button>
        {onRemove &&
          (confirm ? (
            <span className="flex items-center gap-1">
              <button type="button" onClick={onRemove} className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-semibold text-white">
                Delete
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100">
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="rounded-lg p-2 text-gray-500 hover:bg-danger/10 hover:text-danger" aria-label="Delete">
              <Trash2 className="size-4" />
            </button>
          ))}
      </div>
      {open && <div className="grid gap-4 border-t border-gray-100 p-4 sm:grid-cols-2 sm:p-5">{children}</div>}
    </div>
  );
}

/** Repeatable rows (capabilities, outcomes, solutions…). */
function Rows<T>({
  label,
  items,
  onChange,
  blank,
  render,
  max,
}: {
  label: string;
  items: T[];
  onChange: (v: T[]) => void;
  blank: T;
  render: (item: T, set: (v: T) => void) => ReactNode;
  max: number;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <span className="block text-xs font-semibold text-gray-700">{label}</span>
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">{render(it, (v) => onChange(setAt(items, i, v)))}</div>
          <div className="flex flex-col">
            <button type="button" onClick={() => onChange(move(items, i, -1))} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move up">
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" onClick={() => onChange(move(items, i, 1))} disabled={i === items.length - 1} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move down">
              <ArrowDown className="size-3.5" />
            </button>
            <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} className="rounded p-1 text-gray-400 hover:text-danger" aria-label="Remove">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, structuredClone(blank)])} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-strong hover:underline">
          <Plus className="size-3.5" aria-hidden /> Add
        </button>
      )}
    </div>
  );
}

/* ---------- blanks for new items ---------- */

const newService = (n: number): ServiceDoc => ({
  id: `new-service-${n}`,
  number: String(n).padStart(2, "0"),
  icon: "Sparkles",
  title: "New service",
  short: "New service",
  tagline: "One line that sells it.",
  summary: "What this service does and who it's for.",
  capabilities: [{ icon: "Sparkles", title: "Capability", text: "What it means for the client." }],
  value: { headline: "The business value in one sentence.", outcomes: [{ label: "Outcome", text: "Why it matters." }] },
  deliverables: ["Deliverable"],
});
const newIndustry = (n: number): IndustryDoc => ({
  id: `new-industry-${n}`,
  icon: "Building2",
  name: "New industry",
  kicker: "Who we help",
  intro: "How software helps this industry.",
  challenges: ["A common challenge"],
  solutions: [],
  standards: [],
  metric: { value: "24/7", label: "what it enables" },
  accent: "#0d9488",
});
const newEngagement = (): EngagementDoc => ({ icon: "Blocks", name: "New model", duration: "Ongoing", text: "How this engagement works.", points: ["Key point"] });
const newFaq = (): FaqDoc => ({ q: "New question?", a: "The answer." });

/** Trim and drop empty lines/rows before saving. */
function clean(c: ServicesContent): ServicesContent {
  const lines = (a: string[]) => a.map((s) => s.trim()).filter(Boolean);
  return {
    services: c.services.map((s) => ({ ...s, deliverables: lines(s.deliverables) })),
    industries: c.industries.map((i) => ({ ...i, challenges: lines(i.challenges), standards: lines(i.standards), solutions: i.solutions.filter((x) => x.text.trim()) })),
    engagements: c.engagements.map((e) => ({ ...e, points: lines(e.points) })),
    faqs: c.faqs,
  };
}

/* ---------- editor ---------- */

export function ServicesEditor({ initial, isCustom }: { initial: ServicesContent; isCustom: boolean }) {
  const [c, setC] = useState(initial);
  const [tab, setTab] = useState<Tab>("services");
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<ServicesSaveState>({});
  const [pending, start] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  const update = (next: Partial<ServicesContent>) => {
    setC((p) => ({ ...p, ...next }));
    setDirty(true);
    setState({});
  };

  const save = () =>
    start(async () => {
      const r = await saveServicesContentAction(JSON.stringify(clean(c)));
      setState(r);
      if (r.ok) setDirty(false);
    });
  const reset = () =>
    start(async () => {
      const r = await resetServicesContentAction();
      setState(r);
      setConfirmReset(false);
      if (r.ok) window.location.reload();
    });

  const serviceOptions = c.services.map((s) => ({ id: s.id, label: s.short || s.title }));

  return (
    <div className="space-y-6">
      {/* toolbar */}
      <div className="sticky top-[7.5rem] z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-surface/95 p-3 shadow-soft backdrop-blur">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium", tab === t.id ? "bg-gray-900 text-white dark:bg-primary dark:text-gray-950" : "text-gray-600 hover:bg-gray-100")}
            >
              {t.label} <span className="opacity-60">{c[t.id].length}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href="/services" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
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

      {tab === "services" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            The first four services have custom illustrations; extra services use a generic scene. The <code>id</code> is used in links like /services#web-mobile.
          </p>
          {c.services.map((s, i) => {
            const set = (patch: Partial<ServiceDoc>) => update({ services: setAt(c.services, i, { ...s, ...patch }) });
            return (
              <ItemCard
                key={i}
                title={s.title}
                subtitle={`#${s.id}`}
                index={i}
                count={c.services.length}
                onMove={(d) => update({ services: move(c.services, i, d) })}
                onRemove={c.services.length > 1 ? () => update({ services: c.services.filter((_, k) => k !== i) }) : undefined}
              >
                <Field label="Title"><Text value={s.title} onChange={(v) => set({ title: v })} /></Field>
                <Field label="Short name" hint="Used in tabs and lists"><Text value={s.short} onChange={(v) => set({ short: v })} /></Field>
                <Field label="Id (link anchor)"><Text value={s.id} onChange={(v) => set({ id: v })} /></Field>
                <div className="grid grid-cols-[5rem_1fr] gap-3">
                  <Field label="Number"><Text value={s.number} onChange={(v) => set({ number: v })} /></Field>
                  <Field label="Icon"><IconSelect value={s.icon} onChange={(v) => set({ icon: v })} /></Field>
                </div>
                <Field label="Tagline" wide><Text value={s.tagline} onChange={(v) => set({ tagline: v })} /></Field>
                <Field label="Summary" wide><Area value={s.summary} onChange={(v) => set({ summary: v })} /></Field>
                <Rows
                  label="Capabilities"
                  items={s.capabilities}
                  max={10}
                  blank={{ icon: "Sparkles", title: "", text: "" }}
                  onChange={(v) => set({ capabilities: v })}
                  render={(it, setIt) => (
                    <>
                      <div className="space-y-2">
                        <IconSelect value={it.icon} onChange={(v) => setIt({ ...it, icon: v })} />
                        <Text value={it.title} placeholder="Title" onChange={(v) => setIt({ ...it, title: v })} />
                      </div>
                      <Area rows={3} value={it.text} onChange={(v) => setIt({ ...it, text: v })} />
                    </>
                  )}
                />
                <Field label="Value headline" wide><Area rows={2} value={s.value.headline} onChange={(v) => set({ value: { ...s.value, headline: v } })} /></Field>
                <Rows
                  label="Outcomes"
                  items={s.value.outcomes}
                  max={6}
                  blank={{ label: "", text: "" }}
                  onChange={(v) => set({ value: { ...s.value, outcomes: v } })}
                  render={(it, setIt) => (
                    <>
                      <Text value={it.label} placeholder="Label" onChange={(v) => setIt({ ...it, label: v })} />
                      <Text value={it.text} placeholder="Text" onChange={(v) => setIt({ ...it, text: v })} />
                    </>
                  )}
                />
                <Field label="Deliverables" hint="One per line" wide><Lines value={s.deliverables} onChange={(v) => set({ deliverables: v })} /></Field>
              </ItemCard>
            );
          })}
          {c.services.length < 12 && (
            <AddButton onClick={() => update({ services: [...c.services, newService(c.services.length + 1)] })}>Add service</AddButton>
          )}
        </div>
      )}

      {tab === "industries" && (
        <div className="space-y-3">
          {c.industries.map((ind, i) => {
            const set = (patch: Partial<IndustryDoc>) => update({ industries: setAt(c.industries, i, { ...ind, ...patch }) });
            return (
              <ItemCard
                key={i}
                title={ind.name}
                subtitle={ind.kicker}
                index={i}
                count={c.industries.length}
                onMove={(d) => update({ industries: move(c.industries, i, d) })}
                onRemove={() => update({ industries: c.industries.filter((_, k) => k !== i) })}
              >
                <Field label="Name"><Text value={ind.name} onChange={(v) => set({ name: v })} /></Field>
                <Field label="Kicker" hint="Short phrase under the name"><Text value={ind.kicker} onChange={(v) => set({ kicker: v })} /></Field>
                <Field label="Id"><Text value={ind.id} onChange={(v) => set({ id: v })} /></Field>
                <div className="grid grid-cols-[1fr_6rem] gap-3">
                  <Field label="Icon"><IconSelect value={ind.icon} onChange={(v) => set({ icon: v })} /></Field>
                  <Field label="Accent">
                    <input type="color" value={ind.accent} onChange={(e) => set({ accent: e.target.value })} className="h-9 w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50" />
                  </Field>
                </div>
                <Field label="Intro" wide><Area value={ind.intro} onChange={(v) => set({ intro: v })} /></Field>
                <Field label="Challenges" hint="One per line"><Lines value={ind.challenges} onChange={(v) => set({ challenges: v })} /></Field>
                <Field label="Standards & compliance" hint="One per line"><Lines value={ind.standards} onChange={(v) => set({ standards: v })} /></Field>
                <Rows
                  label="Solutions (linked to a service)"
                  items={ind.solutions}
                  max={10}
                  blank={{ service: serviceOptions[0]?.id ?? "", text: "" }}
                  onChange={(v) => set({ solutions: v })}
                  render={(it, setIt) => (
                    <>
                      <select className={inputCls} value={it.service} onChange={(e) => setIt({ ...it, service: e.target.value })}>
                        {serviceOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <Text value={it.text} placeholder="What we build" onChange={(v) => setIt({ ...it, text: v })} />
                    </>
                  )}
                />
                <Field label="Metric value"><Text value={ind.metric.value} onChange={(v) => set({ metric: { ...ind.metric, value: v } })} /></Field>
                <Field label="Metric label"><Text value={ind.metric.label} onChange={(v) => set({ metric: { ...ind.metric, label: v } })} /></Field>
              </ItemCard>
            );
          })}
          <AddButton onClick={() => update({ industries: [...c.industries, newIndustry(c.industries.length + 1)] })}>Add industry</AddButton>
        </div>
      )}

      {tab === "engagements" && (
        <div className="space-y-3">
          {c.engagements.map((e, i) => {
            const set = (patch: Partial<EngagementDoc>) => update({ engagements: setAt(c.engagements, i, { ...e, ...patch }) });
            return (
              <ItemCard
                key={i}
                title={e.name}
                subtitle={e.duration}
                index={i}
                count={c.engagements.length}
                onMove={(d) => update({ engagements: move(c.engagements, i, d) })}
                onRemove={() => update({ engagements: c.engagements.filter((_, k) => k !== i) })}
              >
                <Field label="Name"><Text value={e.name} onChange={(v) => set({ name: v })} /></Field>
                <Field label="Duration"><Text value={e.duration} onChange={(v) => set({ duration: v })} /></Field>
                <Field label="Icon"><IconSelect value={e.icon} onChange={(v) => set({ icon: v })} /></Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                  <input type="checkbox" checked={Boolean(e.featured)} onChange={(ev) => set({ featured: ev.target.checked })} className="size-4 accent-[rgb(var(--color-primary))]" />
                  Highlight as recommended
                </label>
                <Field label="Description" wide><Area value={e.text} onChange={(v) => set({ text: v })} /></Field>
                <Field label="Points" hint="One per line" wide><Lines value={e.points} onChange={(v) => set({ points: v })} /></Field>
              </ItemCard>
            );
          })}
          {c.engagements.length < 8 && <AddButton onClick={() => update({ engagements: [...c.engagements, newEngagement()] })}>Add engagement model</AddButton>}
        </div>
      )}

      {tab === "faqs" && (
        <div className="space-y-3">
          {c.faqs.map((f, i) => {
            const set = (patch: Partial<FaqDoc>) => update({ faqs: setAt(c.faqs, i, { ...f, ...patch }) });
            return (
              <ItemCard
                key={i}
                title={f.q}
                index={i}
                count={c.faqs.length}
                onMove={(d) => update({ faqs: move(c.faqs, i, d) })}
                onRemove={() => update({ faqs: c.faqs.filter((_, k) => k !== i) })}
              >
                <Field label="Question" wide><Text value={f.q} onChange={(v) => set({ q: v })} /></Field>
                <Field label="Answer" wide><Area rows={4} value={f.a} onChange={(v) => set({ a: v })} /></Field>
              </ItemCard>
            );
          })}
          <AddButton onClick={() => update({ faqs: [...c.faqs, newFaq()] })}>Add question</AddButton>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6 text-sm">
        {isCustom ? (
          confirmReset ? (
            <>
              <span className="text-gray-600">Discard all edits and restore the original services content?</span>
              <button type="button" onClick={reset} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white">
                Restore original
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="text-xs text-gray-500 hover:text-gray-900">
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900">
              <RotateCcw className="size-4" aria-hidden /> Restore original content
            </button>
          )
        ) : (
          <span className="text-gray-500">Showing the built-in content. Your first save stores it in the database.</span>
        )}
      </div>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-semibold text-gray-500 transition-colors hover:border-primary/50 hover:text-primary-strong"
    >
      <Plus className="size-4" aria-hidden /> {children}
    </button>
  );
}
