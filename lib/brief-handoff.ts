/**
 * Hands a visitor's idea from anywhere on the site to the project brief on /contact.
 * Stored in sessionStorage so it survives the page change; the brief reads it once.
 */
export type BriefHandoff = { story?: string; types?: string[] };

const KEY = "picode:brief";

export function saveBriefHandoff(data: BriefHandoff) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage blocked: the visitor just starts with an empty brief */
  }
  // Same-page listeners (if the brief is already mounted).
  window.dispatchEvent(new CustomEvent<BriefHandoff>("picode:prefill", { detail: data }));
}

export function takeBriefHandoff(): BriefHandoff | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const data = JSON.parse(raw) as BriefHandoff;
    return {
      story: typeof data.story === "string" ? data.story.slice(0, 2000) : undefined,
      types: Array.isArray(data.types) ? data.types.filter((t): t is string => typeof t === "string") : undefined,
    };
  } catch {
    return null;
  }
}
