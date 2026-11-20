"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { iconByName } from "@/lib/content/icon-registry";
import type { Industry, Service } from "@/lib/content/services";
import type { ServicesContent } from "@/lib/content/services-content";
import type { LucideIcon } from "lucide-react";

export type Engagement = {
  icon: LucideIcon;
  name: string;
  duration: string;
  text: string;
  points: string[];
  featured?: boolean;
};

type Resolved = {
  services: Service[];
  industries: Industry[];
  engagements: Engagement[];
  faqs: { q: string; a: string }[];
};

const Ctx = createContext<Resolved | null>(null);

/** Services page content from the database, with icon names turned back into icons. */
export function ServicesContentProvider({ content, children }: { content: ServicesContent; children: ReactNode }) {
  const value = useMemo<Resolved>(
    () => ({
      services: content.services.map((s) => ({
        ...s,
        icon: iconByName(s.icon),
        capabilities: s.capabilities.map((c) => ({ ...c, icon: iconByName(c.icon) })),
      })),
      industries: content.industries.map((i) => ({ ...i, icon: iconByName(i.icon) })),
      engagements: content.engagements.map((e) => ({ ...e, icon: iconByName(e.icon) })),
      faqs: content.faqs,
    }),
    [content],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useServicesContent(): Resolved {
  const v = useContext(Ctx);
  if (!v) throw new Error("useServicesContent must be used inside <ServicesContentProvider>");
  return v;
}
