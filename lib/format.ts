/**
 * Date / time formatting driven by the admin's preferences (Admin → Settings).
 * Plain string tokens so it works the same on the server and in the browser.
 */
export const DATE_FORMATS = ["d MMM yyyy", "MMM d, yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"] as const;
export const TIME_FORMATS = ["12h", "24h"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];
export type TimeFormat = (typeof TIME_FORMATS)[number];
export type Preferences = { dateFormat: DateFormat; timeFormat: TimeFormat };

export const DEFAULT_PREFERENCES: Preferences = { dateFormat: "d MMM yyyy", timeFormat: "12h" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

type Parts = { y: number; m: number; d: number; h: number; min: number };

function parts(input: Date | string, utc = false): Parts | null {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return null;
  return utc
    ? { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate(), h: date.getUTCHours(), min: date.getUTCMinutes() }
    : { y: date.getFullYear(), m: date.getMonth(), d: date.getDate(), h: date.getHours(), min: date.getMinutes() };
}

function dateFrom(p: Parts, fmt: DateFormat) {
  switch (fmt) {
    case "MMM d, yyyy":
      return `${MONTHS[p.m]} ${p.d}, ${p.y}`;
    case "dd/MM/yyyy":
      return `${pad(p.d)}/${pad(p.m + 1)}/${p.y}`;
    case "MM/dd/yyyy":
      return `${pad(p.m + 1)}/${pad(p.d)}/${p.y}`;
    case "yyyy-MM-dd":
      return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}`;
    default:
      return `${p.d} ${MONTHS[p.m]} ${p.y}`;
  }
}

/** Clock time, e.g. "2:05 PM" (12h) or "14:05" (24h). */
export function clock(hours: number, minutes: number, tf: TimeFormat) {
  if (tf === "24h") return `${pad(hours)}:${pad(minutes)}`;
  return `${hours % 12 || 12}:${pad(minutes)} ${hours < 12 ? "AM" : "PM"}`;
}

export function formatDate(input: Date | string, fmt: DateFormat = DEFAULT_PREFERENCES.dateFormat, { utc = false } = {}) {
  const p = parts(input, utc);
  return p ? dateFrom(p, fmt) : "";
}

export function formatTime(input: Date | string, tf: TimeFormat = DEFAULT_PREFERENCES.timeFormat) {
  const p = parts(input);
  return p ? clock(p.h, p.min, tf) : "";
}

export function formatDateTime(input: Date | string, prefs: Preferences = DEFAULT_PREFERENCES) {
  const p = parts(input);
  return p ? `${dateFrom(p, prefs.dateFormat)}, ${clock(p.h, p.min, prefs.timeFormat)}` : "";
}
