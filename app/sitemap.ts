import type { MetadataRoute } from "next";
import { listJobs } from "@/lib/server/careers";
import { footerNav, mainNav, siteConfig, underDevelopmentRoutes } from "@/lib/site";

/**
 * /sitemap.xml
 *
 * Built from the site's own navigation so it stays in sync: every internal
 * link in the header and footer is listed, EXCEPT routes still served by the
 * "under development" fallback. Those pages are noindex, and listing noindex
 * URLs in a sitemap makes search consoles report errors. When a real page
 * ships and its entry is removed from `underDevelopmentRoutes`, it appears
 * here automatically.
 *
 * /admin and /api are never included (see app/robots.ts).
 */
const extraRoutes = ["/privacy", "/terms", "/sitemap"]; // linked from the footer bottom bar

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/+$/, "");
  const hrefs = new Set<string>(["/"]);
  for (const item of mainNav) hrefs.add(item.href);
  for (const group of footerNav) for (const item of group.items) hrefs.add(item.href);
  for (const href of extraRoutes) hrefs.add(href);

  // Each open role has its own page (skipped if the careers database is unavailable).
  const jobs = await listJobs({ publishedOnly: true }).catch(() => []);
  for (const j of jobs) hrefs.add(`/careers/${j.id}`);

  const lastModified = new Date();
  return [...hrefs]
    .filter((href) => href.startsWith("/") && !href.includes("#") && !href.startsWith("/admin") && !href.startsWith("/api"))
    .filter((href) => !(href.replace(/^\//, "") in underDevelopmentRoutes))
    .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b))
    .map((href) => ({
      url: `${base}${href === "/" ? "" : href}`,
      lastModified,
      changeFrequency: href === "/" ? "weekly" : "monthly",
      priority: href === "/" ? 1 : href.split("/").length === 2 ? 0.8 : 0.6,
    }));
}
