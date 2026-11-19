import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageUnderDevelopment } from "@/components/layout/page-under-development";
import { underDevelopmentRoutes } from "@/lib/site";

type Params = { slug: string[] };

/**
 * Only the routes listed in lib/site.ts render the fallback; anything else 404s
 * via notFound() below. (We intentionally keep `dynamicParams` at its default:
 * with `false`, Next 14 serves 404 for these paths after an on-demand
 * revalidatePath() from the admin panel.)
 */
export function generateStaticParams(): Params[] {
  return Object.keys(underDevelopmentRoutes).map((path) => ({ slug: path.split("/") }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const title = underDevelopmentRoutes[params.slug.join("/")];
  return { title: title ?? "Coming Soon", robots: { index: false } };
}

export default function UnderDevelopmentPage({ params }: { params: Params }) {
  const title = underDevelopmentRoutes[params.slug.join("/")];
  if (!title) notFound();
  return <PageUnderDevelopment title={title} />;
}
