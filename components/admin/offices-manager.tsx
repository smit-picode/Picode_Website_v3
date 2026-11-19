"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Mail, MapPin, Navigation, Pencil, Phone, Plus, Trash2, X } from "lucide-react";
import { deleteOfficeAction, saveOfficeAction, type FormState } from "@/app/admin/actions";
import { SavedToast, SaveButton } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { CountryBadge } from "@/components/ui/country-badge";
import { formatCoords, mapsUrl, type Office } from "@/lib/content/types";

export function OfficesManager({ offices }: { offices: Office[] }) {
  const [editing, setEditing] = useState<Office | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing("new")}>
          Add office
        </Button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            key={editing === "new" ? "new" : editing.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <OfficeForm office={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2">
        {offices.map((o) => (
          <article key={o.id} className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-h3">
                  <CountryBadge code={o.countryCode} /> {o.city}
                </h3>
                {o.name && <p className="text-sm font-medium text-gray-700">{o.name}</p>}
                <p className="text-sm text-gray-500">
                  {o.country}
                  {o.timezone && ` · ${o.timezone}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {o.isHeadquarters && (
                  <span className="rounded-full bg-gradient-primary px-2.5 py-0.5 text-[0.6875rem] font-semibold text-white">HQ</span>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(o)}
                  aria-label={`Edit ${o.city}`}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(o.id)}
                  aria-label={`Delete ${o.city}`}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-danger/40 hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2.5 text-gray-600">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden /> {o.address}
              </li>
              <li className="flex items-center gap-2.5 text-gray-900">
                <Phone className="size-4 shrink-0 text-primary-strong" aria-hidden /> {o.phone}
              </li>
              <li className="flex items-center gap-2.5 text-gray-600">
                <Mail className="size-4 shrink-0 text-primary-strong" aria-hidden /> {o.email}
              </li>
              <li>
                <a
                  href={mapsUrl(o)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 font-mono text-xs text-gray-500 hover:text-primary-strong"
                >
                  <Navigation className="size-4 shrink-0 text-primary-strong" aria-hidden /> {formatCoords(o.lat, o.lng)}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </li>
            </ul>

            {confirmId === o.id && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">
                Remove the {o.city} office from the website?
                <button
                  type="button"
                  onClick={() => {
                    setConfirmId(null);
                    startTransition(() => deleteOfficeAction(o.id));
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
          </article>
        ))}
      </div>

      {offices.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
          No offices yet — add your first one.
        </p>
      )}
    </div>
  );
}

function OfficeForm({ office, onClose }: { office: Office | null; onClose: () => void }) {
  const [state, action] = useFormState<FormState, FormData>(saveOfficeAction, {});
  const e = state.fieldErrors ?? {};

  // Close the editor shortly after a successful save.
  useEffect(() => {
    if (!state.ok) return;
    const t = window.setTimeout(onClose, 900);
    return () => window.clearTimeout(t);
  }, [state, onClose]);

  return (
    <form action={action} noValidate className="rounded-2xl border border-primary/30 bg-surface p-6 shadow-float sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-h3">{office ? `Edit ${office.city}` : "New office"}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="size-4" />
        </button>
      </div>

      <input type="hidden" name="id" value={office?.id ?? ""} />
      <div className="grid gap-5 sm:grid-cols-6">
        <Input
          name="name"
          label="Office name"
          placeholder="Picode India"
          defaultValue={office?.name}
          error={e.name}
          hint="Shown on the office card under the city"
          wrapperClassName="sm:col-span-4"
        />
        <Input
          name="code"
          label="Short code"
          placeholder="BLR"
          maxLength={4}
          defaultValue={office?.code}
          error={e.code}
          hint="Short tag on the globe, e.g. BLR"
          wrapperClassName="sm:col-span-2"
        />
        <Input name="city" label="City" placeholder="Bengaluru" defaultValue={office?.city} error={e.city} wrapperClassName="sm:col-span-2" />
        <Input name="country" label="Country" placeholder="India" defaultValue={office?.country} error={e.country} wrapperClassName="sm:col-span-2" />
        <Input
          name="countryCode"
          label="Country code"
          placeholder="IN"
          maxLength={2}
          defaultValue={office?.countryCode}
          error={e.countryCode}
          hint="2 letters, e.g. IN, AE"
          wrapperClassName="sm:col-span-2"
        />
        <Textarea
          name="address"
          label="Address"
          rows={2}
          placeholder="Street, area, city, postcode"
          defaultValue={office?.address}
          error={e.address}
          wrapperClassName="sm:col-span-6"
        />
        <Input name="phone" type="tel" label="Phone" placeholder="+91 80 1234 5678" defaultValue={office?.phone} error={e.phone} wrapperClassName="sm:col-span-3" />
        <Input name="email" type="email" label="Office email" placeholder="india@company.com" defaultValue={office?.email} error={e.email} wrapperClassName="sm:col-span-3" />
        <Input name="label" label="Label" placeholder="Headquarters" defaultValue={office?.label} error={e.label} wrapperClassName="sm:col-span-2" />
        <Input name="timezone" label="Timezone" placeholder="IST (UTC+5:30)" defaultValue={office?.timezone} error={e.timezone} wrapperClassName="sm:col-span-2" />
        <CoordinateFields office={office} errors={e} />
      </div>

      <label className="mt-6 flex items-center gap-3 text-sm font-medium text-gray-800">
        <input
          type="checkbox"
          name="isHeadquarters"
          defaultChecked={office?.isHeadquarters}
          className="size-4 rounded border-gray-300 accent-[rgb(45_212_191)]"
        />
        This is the headquarters (shown first, highlighted on the site)
      </label>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SaveButton label={office ? "Save office" : "Add office"} />
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <SavedToast message={state.ok ? state.message : undefined} stamp={state} />
      </div>
    </form>
  );
}

/**
 * Latitude / longitude with a paste helper ("12.9716, 77.5946" — what Google Maps copies
 * when you right-click a place) and a live "check on Google Maps" link.
 */
function CoordinateFields({ office, errors }: { office: Office | null; errors: Record<string, string> }) {
  const [lat, setLat] = useState(office ? String(office.lat) : "");
  const [lng, setLng] = useState(office ? String(office.lng) : "");
  const valid = lat !== "" && lng !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const m = e.clipboardData.getData("text").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return;
    e.preventDefault();
    setLat(m[1]!);
    setLng(m[2]!);
  }

  return (
    <div className="sm:col-span-6">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Input
          name="lat"
          type="number"
          step="any"
          label="Latitude"
          value={lat}
          onChange={(ev) => setLat(ev.target.value)}
          onPaste={onPaste}
          error={errors.lat}
          placeholder="12.9716"
        />
        <Input
          name="lng"
          type="number"
          step="any"
          label="Longitude"
          value={lng}
          onChange={(ev) => setLng(ev.target.value)}
          onPaste={onPaste}
          error={errors.lng}
          placeholder="77.5946"
        />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        Tip: right-click the building in Google Maps, click the coordinates to copy them, and paste here.
        {valid && (
          <a
            href={mapsUrl({ lat: Number(lat), lng: Number(lng) })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary-strong hover:underline"
          >
            Check on Google Maps <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </p>
    </div>
  );
}
