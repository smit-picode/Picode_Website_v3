"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { ArrowUpRight, Briefcase, Clock, LifeBuoy, Mail, MapPin, Navigation, Phone } from "lucide-react";
import type { GlobePin, PointerRef } from "@/components/contact/globe-scene";
import { Container, Eyebrow } from "@/components/ui/container";
import { mapsUrl, officeCode, type Office, type SiteSettings } from "@/lib/content/types";
import { cn } from "@/lib/utils";

// three.js + the land dots only load when the planet is about to be seen.
const GlobeScene = dynamic(() => import("@/components/contact/globe-scene"), { ssr: false, loading: () => null });

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/* ------------------------------------------------------------------ */
/* Local time                                                           */
/* ------------------------------------------------------------------ */

/** Minutes east of UTC from a label like "IST (UTC+5:30)" or "GST (UTC+4)". */
function utcOffset(timezone: string): number | null {
  const m = timezone.match(/UTC\s*([+-−])\s*(\d{1,2})(?::(\d{2}))?/i);
  if (!m) return null;
  return (m[1] === "+" ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Live local time and whether the office is in working hours (Mon–Fri 9:00–18:00). */
function useLocalTime(timezone: string) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  const offset = utcOffset(timezone);
  if (!now || offset === null) return null;
  const local = new Date(now.getTime() + offset * 60_000);
  const h = local.getUTCHours();
  const day = local.getUTCDay();
  return {
    hh: String(h % 12 || 12),
    mm: String(local.getUTCMinutes()).padStart(2, "0"),
    ampm: h < 12 ? "AM" : "PM",
    zone: timezone.split(" ")[0] ?? "",
    open: day >= 1 && day <= 5 && h >= 9 && h < 18,
  };
}

/* ------------------------------------------------------------------ */
/* Band                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Offices as hubs of one network: night falls, the Earth's curve rises as the horizon,
 * each office is a beacon with data streaming between them, and the office cards are
 * glass "node" panels. Ends in the footer's colour so the page closes seamlessly.
 */
export function OfficesBand({ offices, settings }: { offices: Office[]; settings: SiteSettings }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: "500px" });
  const reduce = useReducedMotion();
  const dark = useTheme().resolvedTheme === "dark";
  const [active, setActive] = useState<string | null>(null);
  const [pinHover, setPinHover] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const pointer: PointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(Boolean(c.getContext("webgl2") ?? c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
  };

  const pins: GlobePin[] = offices.map((o) => ({
    id: o.id,
    code: officeCode(o),
    label: o.city,
    lat: o.lat,
    lng: o.lng,
    url: mapsUrl(o),
    primary: o.isHeadquarters,
  }));
  const floating = offices.length <= 2;
  // Floating cards follow the map: the western office on the left, the eastern one on the right.
  const westToEast = [...offices].sort((x, y) => x.lng - y.lng);

  return (
    <div
      id="offices"
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => (pointer.current = { x: 0, y: 0 })}
      className="relative isolate mt-16 overflow-hidden lg:mt-24"
    >
      {/* Studio backdrop: a seamless sweep lit by a key light behind the planet, a softbox
          from above and a gentle vignette, like a product shot. Fades out at the top and bottom
          so it blends into the sections around it. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
      >
        {/* sweep: slightly deeper tone toward the edges */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_60%,transparent_30%,rgb(15_23_42/0.16))] dark:bg-[radial-gradient(120%_90%_at_50%_60%,transparent_25%,rgb(0_0_0/0.7))]" />
        {/* key light behind the planet */}
        <div className="absolute left-1/2 top-[58%] aspect-[1.6] w-[95rem] max-w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(255_255_255),rgb(255_255_255/0.75)_35%,rgb(var(--color-secondary)/0.14)_62%,transparent)] dark:bg-[radial-gradient(closest-side,rgb(56_189_248/0.30),rgb(45_212_191/0.12)_45%,transparent)]" />
        {/* softbox from above */}
        <div className="absolute left-1/2 top-0 h-[60%] w-[70rem] max-w-full -translate-x-1/2 bg-[radial-gradient(50%_100%_at_50%_0%,rgb(255_255_255/0.9),transparent_75%)] dark:bg-[radial-gradient(50%_100%_at_50%_0%,rgb(148_163_184/0.12),transparent_75%)]" />
        {/* brand-tinted bounce light on the floor */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(45%_55%_at_50%_100%,rgb(var(--color-primary)/0.16),transparent_70%)]" />
      </div>

      {/* Heading + live status strip */}
      <Container className="relative pb-4 pt-16 text-center sm:pt-20">
        <Eyebrow center>Our offices</Eyebrow>
        <h2 className="mx-auto mt-5 max-w-3xl text-display-3">
          Two hubs. <span className="text-gradient-primary">One codebase.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-gray-500">
          Engineering from Bengaluru and Dubai, shipping around the clock. Click a hub to get directions.
        </p>
      </Container>

      {/* Planet + node cards */}
      <div className="relative mt-6">
        <div className="relative h-[20rem] sm:h-[28rem] lg:h-[40rem]">
          {webgl && near && (
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-[1500ms] [mask-image:linear-gradient(to_bottom,black_72%,transparent)]",
                ready ? "opacity-100" : "opacity-0",
              )}
            >
              <GlobeScene pins={pins} active={pinHover ?? active} focus={active} onHover={setPinHover} motion={!reduce} pointer={pointer} dark={dark} onReady={() => setReady(true)} />
            </div>
          )}
          {floating && (
            <Container className="pointer-events-none absolute inset-0 hidden lg:block">
              <div className="relative h-full">
                {westToEast.map((o, i) => (
                  <div
                    key={o.id}
                    className={cn(
                      "pointer-events-auto absolute w-[22rem] xl:w-[23.5rem]",
                      i === 0 ? "left-0 top-[4%] xl:-left-6" : "right-0 top-[4%] xl:-right-6",
                    )}
                  >
                    <NodeCard office={o} active={(pinHover ?? active) === o.id} onActive={setActive} side={i === 0 ? "left" : "right"} />
                  </div>
                ))}
              </div>
            </Container>
          )}
        </div>
        <Container className={cn("relative -mt-6 grid gap-5 sm:grid-cols-2", floating && "lg:hidden")}>
          {offices.map((o) => (
            <NodeCard key={o.id} office={o} active={(pinHover ?? active) === o.id} onActive={setActive} />
          ))}
        </Container>
      </div>

      {/* Direct lines */}
      <Container className="relative pb-20 pt-12 lg:pb-28 lg:pt-4">
        <DirectLines settings={settings} />
      </Container>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Node card                                                            */
/* ------------------------------------------------------------------ */

function NodeCard({
  office: o,
  active,
  onActive,
  side,
}: {
  office: Office;
  active: boolean;
  onActive: (id: string | null) => void;
  side?: "left" | "right";
}) {
  const t = useLocalTime(o.timezone);
  const code = officeCode(o);
  const color = o.isHeadquarters ? "45 212 191" : "56 189 248";
  return (
    <motion.article
      onMouseEnter={() => onActive(o.id)}
      onMouseLeave={() => onActive(null)}
      onFocus={() => onActive(o.id)}
      onBlur={() => onActive(null)}
      initial={{ opacity: 0, y: 30, x: side === "left" ? -30 : side === "right" ? 30 : 0 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      animate={{ y: active ? -6 : 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-surface/95 backdrop-blur-xl transition-[border-color,box-shadow] duration-300",
        active ? "border-primary/40" : "border-gray-200/80",
      )}
      style={{
        boxShadow: active
          ? `0 30px 70px -30px rgb(${color} / 0.55)`
          : "0 24px 50px -28px rgba(15,23,42,0.28)",
      }}
    >
      {/* glowing top edge in the hub's colour */}
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, rgb(${color}), transparent)`, opacity: active ? 1 : 0.5 }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-500"
        style={{ background: `rgb(${color})`, opacity: active ? 0.14 : 0.05 }}
      />

      {/* header */}
      <div className="relative flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[0.6875rem] text-gray-500">
          <span className="rounded-md px-1.5 py-0.5 font-bold text-white" style={{ background: `rgb(${color})` }}>
            {code}
          </span>
          {o.label || o.country}
        </span>
        {t && (
          <span className={cn("flex items-center gap-1.5 font-mono text-[0.6875rem]", t.open ? "text-success" : "text-gray-400")}>
            <span className={cn("size-1.5 rounded-full", t.open ? "animate-pulse bg-success" : "bg-gray-300")} />
            {t.hh}:{t.mm} {t.ampm} {t.zone}
          </span>
        )}
      </div>

      <div className="relative p-5">
        <h3 className="font-display text-2xl font-semibold tracking-tight text-gray-900">{o.city}</h3>
        <p className="text-sm text-gray-500">{o.name || o.country}</p>

        <ul className="mt-4 space-y-2.5 text-sm">
          <li className="flex gap-2.5 text-gray-600">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden />
            <span>{o.address}</span>
          </li>
          <li>
            <a href={tel(o.phone)} className="inline-flex items-center gap-2.5 font-medium text-gray-900 hover:text-primary-strong">
              <Phone className="size-4 shrink-0 text-primary-strong" aria-hidden />
              {o.phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${o.email}`} className="inline-flex items-center gap-2.5 text-gray-600 hover:text-primary-strong">
              <Mail className="size-4 shrink-0 text-primary-strong" aria-hidden />
              {o.email}
            </a>
          </li>
        </ul>

        <a
          href={mapsUrl(o)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${o.city} office on Google Maps`}
          className="group/map mt-5 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-display text-sm font-semibold text-primary-strong transition-colors hover:border-primary/40 hover:bg-primary/[0.06]"
        >
          <Navigation className="size-4" aria-hidden />
          View on Map
          <ArrowUpRight className="size-4 transition-transform group-hover/map:-translate-y-0.5 group-hover/map:translate-x-0.5" aria-hidden />
        </a>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Direct lines                                                         */
/* ------------------------------------------------------------------ */

function DirectLines({ settings }: { settings: SiteSettings }) {
  const items: { icon: ReactNode; label: string; email: string }[] = [
    { icon: <Mail className="size-4" />, label: "General enquiries", email: settings.generalEmail },
    { icon: <Mail className="size-4" />, label: "Sales & partnerships", email: settings.salesEmail },
    { icon: <Briefcase className="size-4" />, label: "Careers", email: settings.careersEmail },
    { icon: <LifeBuoy className="size-4" />, label: "Support", email: settings.supportEmail },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
        <span className="h-px w-10 bg-gray-200" aria-hidden />
        <Clock className="size-3.5 text-primary-strong" aria-hidden />
        Prefer email? We reply {settings.responseTime.toLowerCase()}.
        <span className="h-px w-10 bg-gray-200" aria-hidden />
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.li
            key={it.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.45 }}
          >
            <a
              href={`mailto:${it.email}`}
              className="group flex h-full items-center gap-3 rounded-2xl border border-gray-200/80 bg-surface p-4 shadow-soft transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary-soft text-primary-strong transition-transform group-hover:scale-110" aria-hidden>
                {it.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-gray-400">{it.label}</span>
                <span className="block truncate text-sm font-medium text-gray-900">{it.email}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-gray-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-strong" aria-hidden />
            </a>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
