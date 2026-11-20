import Link from "next/link";
import { ArrowUpRight, SearchX } from "lucide-react";
import type { JobPost } from "@/lib/content/careers";

/** Open roles as a simple list; each row opens /careers/[id]. */
export function JobBoard({ jobs }: { jobs: JobPost[] }) {
  if (!jobs.length) return <NoOpenings />;
  return (
    <ul className="mt-12 divide-y divide-gray-200/80 border-y border-gray-200/80">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link
            href={`/careers/${j.id}`}
            className="group grid items-center gap-x-8 gap-y-2 py-6 transition-colors sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:py-7"
          >
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold tracking-tight text-gray-900 transition-colors group-hover:text-primary-strong sm:text-2xl">
                {j.title}
              </span>
              <span className="mt-1 block text-sm text-gray-500">{j.team}</span>
            </span>
            <span className="text-sm text-gray-600">
              {[j.location, j.employmentType, j.experience].filter(Boolean).join(" · ")}
            </span>
            <ArrowUpRight
              className="hidden size-5 text-gray-400 transition-all duration-300 group-hover:rotate-45 group-hover:text-primary-strong sm:block"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NoOpenings() {
  return (
    <div className="mt-12 flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-surface/60 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary-strong">
        <SearchX className="size-6" aria-hidden />
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold text-gray-900">No open roles right now</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        We&apos;re not actively hiring for a specific position at the moment, but we&apos;re always happy to meet great people.
        Send us your resume below and we&apos;ll reach out when something fits.
      </p>
      <a href="#talent-pool" className="mt-6 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-primary-strong hover:underline">
        Join the talent pool <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </div>
  );
}
