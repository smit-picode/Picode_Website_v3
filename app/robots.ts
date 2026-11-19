import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/** /robots.txt: public site is crawlable; admin panel and API are not. */
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/+$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
