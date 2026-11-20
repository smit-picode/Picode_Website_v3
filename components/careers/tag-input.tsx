"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Chips + free typing. Enter or comma adds; suggestions are one tap away. */
export function TagInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  error,
  max = 25,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder: string;
  error?: string;
  max?: number;
  hint?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());

  const add = (raw: string) => {
    const t = raw.trim().replace(/,+$/, "").slice(0, 40);
    if (!t || has(t) || value.length >= max) return;
    onChange([...value, t]);
  };
  const remove = (t: string) => onChange(value.filter((v) => v !== t));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]!);
    }
  };

  const q = draft.trim().toLowerCase();
  const shown = suggestions.filter((s) => !has(s) && (!q || s.toLowerCase().includes(q))).slice(0, 10);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-display text-sm font-semibold text-gray-800">
        {label}
      </label>
      <div
        className={cn(
          "flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border bg-gray-50 px-2 py-2 transition-colors focus-within:border-transparent focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary",
          error ? "border-danger/60" : "border-gray-200 hover:border-gray-300",
        )}
      >
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 py-1 pl-2.5 pr-1 text-xs font-semibold text-primary-strong">
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="rounded p-0.5 text-primary-strong/70 transition-colors hover:bg-primary/15 hover:text-primary-strong"
              aria-label={`Remove ${t}`}
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(",")) {
              add(v);
              setDraft("");
            } else setDraft(v);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          placeholder={value.length ? "Add more…" : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-[0.9375rem] text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint ?? "Press Enter or comma to add your own."}
        </p>
      )}
      {shown.length > 0 && value.length < max && (
        <div className="flex flex-wrap gap-1.5" aria-label={`${label} suggestions`}>
          {shown.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors hover:border-primary hover:text-primary-strong"
            >
              <Plus className="size-3" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
