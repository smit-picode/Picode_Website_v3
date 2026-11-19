"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, FolderKanban, Inbox, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const adminTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inquiries", label: "Inquiries", icon: Inbox },
  { id: "case-studies", label: "Case studies", icon: FolderKanban },
  { id: "offices", label: "Offices", icon: Building2 },
  { id: "settings", label: "Contact settings", icon: Settings },
] as const;

export function AdminNav({ newCount }: { newCount: number }) {
  const current = useSearchParams().get("tab") ?? "overview";

  return (
    <nav aria-label="Admin sections" className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
      {adminTabs.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <Link
            key={id}
            href={id === "overview" ? "/admin" : `/admin?tab=${id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
              active ? "text-gray-900" : "text-gray-500 hover:text-gray-900",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {id === "inquiries" && newCount > 0 && (
              <span className="rounded-full bg-gradient-primary px-1.5 py-px text-[0.6875rem] font-semibold text-white">
                {newCount}
              </span>
            )}
            {active && (
              <motion.span
                layoutId="admin-tab"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
