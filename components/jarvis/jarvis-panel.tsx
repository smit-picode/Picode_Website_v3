"use client";

/**
 * Picode assistant: a friendly chat window opened from the floating launcher.
 * No AI calls: visitors pick from frequently asked questions with fixed answers.
 * Anything else is passed to the team (name + email → the admin inquiries inbox),
 * or the visitor can continue on WhatsApp.
 */
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, Check, Sparkles, X } from "lucide-react";
import { FAQ_TOPICS, FAQS, GREETING, GREETING_REPLIES, INTENTS, type Faq, type Intent } from "@/lib/content/assistant-faq";
import type { ContactResponse } from "@/lib/validations/contact";
import { cn } from "@/lib/utils";

export type JarvisMessage = { id: string; role: "user" | "assistant" | "system"; content: string; at: number };

type Props = {
  messages: JarvisMessage[];
  setMessages: React.Dispatch<React.SetStateAction<JarvisMessage[]>>;
  onClose: () => void;
  /** Digits (with country code) for wa.me links; empty hides WhatsApp. */
  whatsapp: string;
  responseTime: string;
};

type Stage = "chat" | "name" | "email" | "sending";
type Chip = { label: string; onPick: () => void; tone?: "back" };

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()));
const EMAIL = /^\S+@\S+\.\S+$/;

/* ------------------------------------------------------------------ */
/* Tiny markdown: **bold**, [links](/path), "- " bullets               */
/* ------------------------------------------------------------------ */
function inline(text: string, onNavigate: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++} className="font-semibold text-gray-900">{m[1]}</strong>);
    else if (m[2] && m[3]) {
      const href = m[3];
      out.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href} onClick={onNavigate} className="font-medium text-primary-strong underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
            {m[2]}
          </Link>
        ) : (
          <a key={k++} href={href} target="_blank" rel="noreferrer" className="font-medium text-primary-strong underline decoration-primary/40 underline-offset-2">
            {m[2]}
          </a>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Rich({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const bullet = /^\s*[-•]\s+/.test(line);
        const body = line.replace(/^\s*[-•]\s+/, "");
        return bullet ? (
          <span key={i} className="mt-1 flex gap-2">
            <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{inline(body, onNavigate)}</span>
          </span>
        ) : (
          <Fragment key={i}>
            {i > 0 && <br />}
            {inline(body, onNavigate)}
          </Fragment>
        );
      })}
    </>
  );
}

const STOP = new Set("what which where when does have with that this there about from will would could should their they them want need like make into just also some more than then your".split(" "));
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9$'.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const FAQ_KEYS = FAQS.map((f) => ({ f, keys: f.keys.map((k) => new RegExp(`(^|[^a-z])${k}`)) }));

/** Best FAQ for a typed question: keyword hits count double, plain word overlap once. */
function matchFaq(text: string): Faq | null {
  const words = (s: string) => new Set((s.match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.has(w)));
  const asked = words(text);
  let best: Faq | null = null;
  let score = 0;
  for (const { f, keys } of FAQ_KEYS) {
    let n = 0;
    for (const k of keys) if (k.test(text)) n += 2;
    for (const w of words(normalise(f.q))) if (asked.has(w)) n += 1;
    if (n > score) {
      score = n;
      best = f;
    }
  }
  return score >= 2 ? best : null;
}

type Understood =
  | { kind: "faq"; faq: Faq; greeted: boolean }
  | { kind: "intent"; intent: Intent }
  | { kind: "greeting" }
  | { kind: "unknown" };

/** Work out what a typed message is: small talk, a known question, or something for the team. */
function understand(raw: string): Understood {
  const text = normalise(raw);
  const rest = text.replace(GREETING, "").replace(/^[\s,!.?]+/, "").trim();
  const greeted = rest.length < text.length;
  if (greeted && !rest) return { kind: "greeting" };
  for (const intent of INTENTS) if (intent.patterns.some((p) => p.test(rest))) return { kind: "intent", intent };
  const faq = matchFaq(rest);
  if (faq) return { kind: "faq", faq, greeted };
  return { kind: "unknown" };
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.24c0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function JarvisPanel({ messages, setMessages, onClose, whatsapp, responseTime }: Props) {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("chat");
  const [typing, setTyping] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [lead, setLead] = useState({ question: "", name: "" });
  /** A question we couldn't answer, waiting for "ask the team?" */
  const [pending, setPending] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const waHref = (text: string) => `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

  const push = useCallback(
    (role: JarvisMessage["role"], content: string) => setMessages((m) => [...m, { id: uid(), role, content, at: Date.now() }]),
    [setMessages],
  );

  /** Assistant reply after a short, natural "typing" pause. */
  const reply = useCallback(
    (content: string) => {
      setTyping(true);
      const t = window.setTimeout(() => {
        setTyping(false);
        push("assistant", content);
      }, 1000 + Math.random() * 1000);
      timers.current.push(t);
    },
    [push],
  );

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  // Greet once.
  useEffect(() => {
    if (messages.length) return;
    const h = new Date().getHours();
    const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: `${part}! 👋 I'm Picode's assistant. Pick a topic below, or type your question and I'll make sure our team gets back to you.`,
        at: Date.now(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, topic, stage]);

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const closeOnSmall = () => {
    if (window.innerWidth < 768) onClose();
  };

  const remember = (f: Faq) => {
    setAsked((a) => (a.includes(f.id) ? a : [...a, f.id]));
    setTopic(f.topic);
  };

  const startLead = (question: string, prompt = "Great, I'll pass it to our team. 🙂 First, what's your **name**?") => {
    setPending(null);
    setLead({ question, name: "" });
    setStage("name");
    reply(prompt);
  };

  const answer = (f: Faq) => {
    setPending(null);
    push("user", f.q);
    remember(f);
    reply(f.a);
  };

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing || stage === "sending") return;
    setInput("");
    push("user", text);

    if (stage === "chat") {
      setPending(null);
      const u = understand(text);
      if (u.kind === "greeting") {
        setTopic(null);
        return reply(pick(GREETING_REPLIES));
      }
      if (u.kind === "intent") {
        if (u.intent.action === "lead") return startLead(text, pick(u.intent.answers));
        if (u.intent.action === "topics") setTopic(null);
        return reply(pick(u.intent.answers));
      }
      if (u.kind === "faq") {
        remember(u.faq);
        return reply(u.greeted ? `Hi there! 👋 ${u.faq.a}` : u.faq.a);
      }
      // No ready answer: offer to pass it to the team.
      setPending(text);
      reply(`Hmm, I don't have a ready answer for that one. 🤔 Shall I pass your question to our team? They reply ${responseTime.toLowerCase()}.`);
      return;
    }

    if (stage === "name") {
      if (text.length < 2) return reply("Could you tell me your name?");
      setLead((l) => ({ ...l, name: text }));
      setStage("email");
      reply(`Thanks, ${text.split(" ")[0]}! What's the best **email** to reach you?`);
      return;
    }

    // stage === "email"
    if (!EMAIL.test(text)) return reply("That email doesn't look quite right. Could you check it?");
    setStage("sending");
    setTyping(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          email: text,
          company: "",
          message: `Question from the website assistant: ${lead.question}`,
          website: "",
        }),
      });
      const body = (await res.json()) as ContactResponse;
      setTyping(false);
      if (!body.ok) {
        setStage("email");
        push("assistant", `Sorry, that didn't go through: ${body.error} Could you try again?`);
        return;
      }
      setStage("chat");
      setTopic(null);
      push(
        "assistant",
        `All set ✓ Your question is with our team, and we'll reply to **${text}** ${responseTime.toLowerCase()}.${
          whatsapp ? "\n\nNeed an answer sooner? Message us on WhatsApp below." : ""
        }`,
      );
    } catch {
      setTyping(false);
      setStage("email");
      push("assistant", "I couldn't reach our server. Please check your connection and try again.");
    }
  };

  /* Suggestions under the conversation */
  const chips: Chip[] = useMemo(() => {
    if (stage !== "chat" || typing) return [];
    if (pending)
      return [
        {
          label: "Yes, ask the team",
          onPick: () => {
            push("user", "Yes, ask the team");
            startLead(pending);
          },
        },
        {
          label: "Browse topics",
          onPick: () => {
            setPending(null);
            setTopic(null);
          },
          tone: "back" as const,
        },
      ];
    if (!topic) return FAQ_TOPICS.map((t) => ({ label: t.label, onPick: () => setTopic(t.id) }));
    const left = FAQS.filter((f) => f.topic === topic && !asked.includes(f.id));
    return [...left.map((f) => ({ label: f.q, onPick: () => answer(f) })), { label: "Other topics", onPick: () => setTopic(null), tone: "back" as const }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, typing, topic, asked, pending]);

  const placeholder = stage === "name" ? "Your name" : stage === "chat" ? "Type your question…" : "you@company.com";

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label="Picode assistant"
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 24 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      style={{ transformOrigin: "100% 100%" }}
      data-lenis-prevent
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-surface text-gray-900 md:inset-auto md:bottom-28 md:right-6 md:h-[min(640px,calc(100vh-9rem))] md:w-[400px] md:rounded-3xl md:border md:border-gray-200/90 md:shadow-[0_30px_80px_-24px_rgba(15,23,42,0.35)]"
    >
      {/* Header */}
      <header className="relative flex items-center gap-3 bg-gradient-primary px-4 py-4 text-white">
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
          <Sparkles className="size-5" aria-hidden />
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.9375rem] font-semibold leading-tight">Picode Assistant</p>
          <p className="truncate text-xs text-white/85">Our team replies {responseTime.toLowerCase()}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15"
          aria-label="Close assistant"
        >
          <X className="size-[1.125rem]" />
        </button>
      </header>

      {/* Conversation */}
      <div ref={logRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-muted/60 px-4 py-5" aria-live="polite">
        {messages.map((m) => {
          const mine = m.role === "user";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn("flex items-end gap-2", mine && "justify-end")}
            >
              {!mine && (
                <span className="mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-white">
                  <Sparkles className="size-3.5" aria-hidden />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed",
                  mine
                    ? "rounded-2xl rounded-br-md bg-gradient-primary text-white shadow-[0_8px_20px_-12px_rgb(var(--color-primary)/0.8)]"
                    : "rounded-2xl rounded-bl-md border border-gray-200/80 bg-surface text-gray-700 shadow-sm",
                )}
              >
                {mine ? m.content : <Rich text={m.content} onNavigate={closeOnSmall} />}
              </div>
            </motion.div>
          );
        })}

        {typing && (
          <div className="flex items-end gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-white">
              <Sparkles className="size-3.5" aria-hidden />
            </span>
            <motion.span
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-gray-200/80 bg-surface px-4 py-3.5 shadow-sm"
              role="status"
              aria-label="Picode Assistant is typing"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-2 rounded-full bg-gradient-primary"
                  animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
                />
              ))}
            </motion.span>
            <span className="mb-1 text-[0.6875rem] text-gray-400">typing…</span>
          </div>
        )}

        {chips.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 pl-9 pt-1">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.onPick}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors",
                  c.tone === "back"
                    ? "inline-flex items-center gap-1 border-gray-200 bg-surface text-gray-500 hover:border-gray-300 hover:text-gray-800"
                    : "border-primary/30 bg-surface text-primary-strong hover:border-primary hover:bg-primary/[0.06]",
                )}
              >
                {c.tone === "back" && <ArrowLeft className="size-3" aria-hidden />}
                {c.label}
              </button>
            ))}
          </motion.div>
        )}

        {stage !== "chat" && !typing && (
          <div className="pl-9">
            <button
              type="button"
              onClick={() => {
                setStage("chat");
                push("assistant", "No problem. Anything else I can help with?");
              }}
              className="text-xs font-medium text-gray-400 underline-offset-2 hover:text-gray-700 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 bg-surface px-3 pb-3 pt-3">
        {whatsapp && (
          <a
            href={waHref(lead.question ? `Hi Picode, ${lead.question}` : "Hi Picode, I have a question.")}
            target="_blank"
            rel="noreferrer"
            className="mb-2.5 flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/[0.08] py-2 text-xs font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/15 dark:text-[#4ade80]"
          >
            <WhatsAppIcon className="size-4" /> Chat with us on WhatsApp
          </a>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
          className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-surface py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={stage === "chat" ? 1000 : 200}
            type={stage === "chat" || stage === "name" ? "text" : "email"}
            autoComplete={stage === "name" ? "name" : stage === "email" ? "email" : "off"}
            placeholder={placeholder}
            disabled={stage === "sending"}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Message the assistant"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing || stage === "sending"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow transition-opacity disabled:opacity-40 disabled:shadow-none"
            aria-label="Send"
          >
            {stage === "sending" ? <Check className="size-[1.125rem]" /> : <ArrowUp className="size-[1.125rem]" />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
