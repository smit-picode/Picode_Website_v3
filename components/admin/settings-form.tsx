"use client";

import { useFormState } from "react-dom";
import { saveSettingsAction, type FormState } from "@/app/admin/actions";
import { SavedToast, SaveButton } from "@/components/admin/form-bits";
import { Input } from "@/components/ui/input";
import type { SiteSettings } from "@/lib/content/types";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useFormState<FormState, FormData>(saveSettingsAction, {});
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="max-w-3xl rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="generalEmail" type="email" label="General enquiries email" defaultValue={settings.generalEmail} error={e.generalEmail} />
        <Input name="salesEmail" type="email" label="Sales & partnerships email" defaultValue={settings.salesEmail} error={e.salesEmail} />
        <Input name="careersEmail" type="email" label="Careers email" defaultValue={settings.careersEmail} error={e.careersEmail} />
        <Input name="supportEmail" type="email" label="Support email" defaultValue={settings.supportEmail} error={e.supportEmail} />
        <Input
          name="responseTime"
          label="Response time message"
          hint='Shown in the contact section, e.g. "Within one business day".'
          defaultValue={settings.responseTime}
          error={e.responseTime}
          wrapperClassName="sm:col-span-2"
        />
        <Input
          name="whatsapp"
          type="tel"
          label="WhatsApp number"
          hint="With country code, e.g. +971 50 123 4567. Used by the chat assistant's “Chat on WhatsApp” button. Leave empty to use the HQ office phone."
          defaultValue={settings.whatsapp ?? ""}
          error={e.whatsapp}
          wrapperClassName="sm:col-span-2"
        />
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SaveButton />
        <SavedToast message={state.ok ? state.message : undefined} stamp={state} />
      </div>
    </form>
  );
}
