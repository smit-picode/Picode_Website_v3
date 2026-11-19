"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-[0.9375rem] text-gray-900 shadow-inner-soft " +
  "placeholder:text-gray-400 transition-[border-color,box-shadow,background-color] duration-300 " +
  "hover:border-gray-300 focus:border-transparent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger/60 aria-[invalid=true]:bg-danger/[0.03] aria-[invalid=true]:focus:ring-danger/70";

type FieldShellProps = {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

function FieldShell({ id, label, hint, error, className, children }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block font-display text-sm font-semibold text-gray-800">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type SharedProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Class for the outer wrapper (label + field + message). */
  wrapperClassName?: string;
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> & SharedProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, wrapperClassName, className, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldBase, "h-12", className)}
        {...props}
      />
    </FieldShell>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & SharedProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, wrapperClassName, className, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldBase, "resize-none py-3", className)}
        {...props}
      />
    </FieldShell>
  );
});
