"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ChevronDown, Inbox, Mail, MailOpen, Reply, Search, Trash2 } from "lucide-react";
import { deleteInquiryAction, setInquiryStatusAction } from "@/app/admin/actions";
import type { Inquiry, InquiryStatus } from "@/lib/content/types";
import { formatDateTime, type Preferences } from "@/lib/format";
import { cn } from "@/lib/utils";

const filters: { id: "all" | InquiryStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "Unread" },
  { id: "read", label: "Read" },
  { id: "archived", label: "Archived" },
];

export function InquiryList({ inquiries, preferences }: { inquiries: Inquiry[]; preferences: Preferences }) {
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Optimistic local overrides so the UI responds instantly.
  const [overrides, setOverrides] = useState<Record<string, InquiryStatus | "deleted">>({});

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries
      .map((i) => (overrides[i.id] && overrides[i.id] !== "deleted" ? { ...i, status: overrides[i.id] as InquiryStatus } : i))
      .filter((i) => overrides[i.id] !== "deleted")
      .filter((i) => (filter === "all" ? i.status !== "archived" : i.status === filter))
      .filter((i) => !q || [i.name, i.email, i.company ?? "", i.message].some((f) => f.toLowerCase().includes(q)));
  }, [inquiries, overrides, filter, query]);

  function setStatus(id: string, status: InquiryStatus) {
    setOverrides((o) => ({ ...o, [id]: status }));
    startTransition(() => setInquiryStatusAction(id, status));
  }

  function remove(id: string) {
    setOverrides((o) => ({ ...o, [id]: "deleted" }));
    setConfirmId(null);
    startTransition(() => deleteInquiryAction(id));
  }

  function toggle(item: Inquiry) {
    const opening = openId !== item.id;
    setOpenId(opening ? item.id : null);
    if (opening && item.status === "new") setStatus(item.id, "read");
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface shadow-soft">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.id ? "bg-gray-900 text-background" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search inquiries</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, message…"
            className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-primary-soft text-primary-strong">
            <Inbox className="size-5" aria-hidden />
          </span>
          <p className="mt-4 font-display font-semibold text-gray-900">No inquiries here</p>
          <p className="mt-1 text-sm text-gray-500">
            {query ? "Try a different search." : "New contact-form submissions will show up in this list."}
          </p>
        </div>
      ) : (
        <ul className={cn("divide-y divide-gray-100", pending && "opacity-90")}>
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-5"
                >
                  <span
                    className={cn("mt-2 size-2 shrink-0 rounded-full", item.status === "new" ? "bg-primary" : "bg-transparent")}
                    aria-label={item.status === "new" ? "Unread" : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className={cn("text-sm text-gray-900", item.status === "new" ? "font-semibold" : "font-medium")}>
                        {item.name}
                      </span>
                      <span className="text-sm text-gray-500">{item.email}</span>
                      {item.company && (
                        <span className="rounded-full bg-gray-100 px-2 py-px text-[0.6875rem] font-medium text-gray-600">{item.company}</span>
                      )}
                      {item.status === "archived" && (
                        <span className="rounded-full bg-gray-100 px-2 py-px text-[0.6875rem] font-medium text-gray-500">Archived</span>
                      )}
                    </p>
                    <p className={cn("mt-0.5 text-sm text-gray-500", !open && "truncate")}>{open ? "" : item.message}</p>
                  </div>
                  <time className="shrink-0 pt-0.5 text-xs text-gray-400" dateTime={item.receivedAt}>
                    {formatDateTime(item.receivedAt, preferences)}
                  </time>
                  <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} aria-hidden />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pl-9 sm:px-5 sm:pl-10">
                        {item.brief && (
                          <dl className="mb-3 grid gap-2 rounded-xl border border-gray-100 p-3 text-sm sm:grid-cols-4">
                            {(
                              [
                                ["Building", item.brief.types.join(", ")],
                                ["Stage", item.brief.stage],
                                ["Timeline", item.brief.timeline],
                                ["Budget", item.brief.budget],
                              ] as const
                            ).map(([k, v]) => (
                              <div key={k}>
                                <dt className="text-[0.6875rem] font-medium uppercase tracking-wider text-gray-400">{k}</dt>
                                <dd className="font-medium text-gray-900">{v || "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">{item.message}</p>
                        <p className="mt-2 text-xs text-gray-400">IP {item.ip}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <a
                            href={`mailto:${item.email}?subject=${encodeURIComponent("Re: your enquiry to Picode")}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white"
                          >
                            <Reply className="size-4" aria-hidden /> Reply
                          </a>
                          {item.status === "read" ? (
                            <ActionButton icon={<Mail className="size-4" />} onClick={() => setStatus(item.id, "new")}>
                              Mark unread
                            </ActionButton>
                          ) : item.status === "new" ? (
                            <ActionButton icon={<MailOpen className="size-4" />} onClick={() => setStatus(item.id, "read")}>
                              Mark read
                            </ActionButton>
                          ) : null}
                          {item.status === "archived" ? (
                            <ActionButton icon={<Inbox className="size-4" />} onClick={() => setStatus(item.id, "read")}>
                              Restore
                            </ActionButton>
                          ) : (
                            <ActionButton icon={<Archive className="size-4" />} onClick={() => setStatus(item.id, "archived")}>
                              Archive
                            </ActionButton>
                          )}
                          {confirmId === item.id ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-danger/10 py-1 pl-3 pr-1 text-sm text-danger">
                              Delete permanently?
                              <button type="button" onClick={() => remove(item.id)} className="rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white">
                                Delete
                              </button>
                              <button type="button" onClick={() => setConfirmId(null)} className="rounded-full px-2 py-1 text-xs font-medium">
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <ActionButton icon={<Trash2 className="size-4" />} onClick={() => setConfirmId(item.id)} danger>
                              Delete
                            </ActionButton>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-medium transition-colors",
        danger ? "text-gray-600 hover:border-danger/40 hover:text-danger" : "text-gray-700 hover:bg-gray-50",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
