"use client";

import { useState, type ReactNode } from "react";
import { useFormState } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { saveSettingsAction, type FormState } from "@/app/admin/actions";
import { SavedToast, SaveButton } from "@/components/admin/form-bits";
import { Input } from "@/components/ui/input";
import type { OptionalSetting, SiteSettings } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useFormState<FormState, FormData>(saveSettingsAction, {});
  const e = state.fieldErrors ?? {};
  const [show, setShow] = useState(settings.show);
  const toggle = (k: OptionalSetting) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const field = (k: OptionalSetting, input: ReactNode, wide?: boolean) => (
    <div className={cn("space-y-1.5", wide && "sm:col-span-2")}>
      <div className={cn("transition-opacity", !show[k] && "opacity-50")}>{input}</div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
        <input
          type="checkbox"
          name={`show_${k}`}
          checked={show[k]}
          onChange={() => toggle(k)}
          className="size-4 rounded border-gray-300 accent-[rgb(var(--color-primary))]"
        />
        {show[k] ? <Eye className="size-3.5 text-primary-strong" aria-hidden /> : <EyeOff className="size-3.5 text-gray-400" aria-hidden />}
        {show[k] ? "Shown on website" : "Hidden on website (optional)"}
      </label>
    </div>
  );

  return (
    <form action={action} className="max-w-3xl rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft sm:p-8" noValidate>
      <p className="mb-6 text-sm text-gray-500">
        Untick a field to hide it on the website. Hidden fields are optional and keep their value, so you can switch them back on later.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {field("generalEmail", <Input name="generalEmail" type="email" label="General enquiries email" defaultValue={settings.generalEmail} error={e.generalEmail} />)}
        {field("salesEmail", <Input name="salesEmail" type="email" label="Sales & partnerships email" defaultValue={settings.salesEmail} error={e.salesEmail} />)}
        {field("careersEmail", <Input name="careersEmail" type="email" label="Careers email" defaultValue={settings.careersEmail} error={e.careersEmail} />)}
        {field("supportEmail", <Input name="supportEmail" type="email" label="Support email" defaultValue={settings.supportEmail} error={e.supportEmail} />)}
        {field(
          "responseTime",
          <Input
            name="responseTime"
            label="Response time message"
            hint='e.g. "Within one business day". When hidden, the site says "We reply soon".'
            defaultValue={settings.responseTime}
            error={e.responseTime}
          />,
          true,
        )}
        {field(
          "whatsapp",
          <Input
            name="whatsapp"
            type="tel"
            label="WhatsApp number"
            hint="With country code, e.g. +971 50 123 4567. Leave empty to use the HQ office phone. When hidden, WhatsApp buttons are removed."
            defaultValue={settings.whatsapp ?? ""}
            error={e.whatsapp}
          />,
          true,
        )}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SaveButton />
        <SavedToast message={state.ok ? state.message : undefined} stamp={state} />
      </div>
    </form>
  );
}
