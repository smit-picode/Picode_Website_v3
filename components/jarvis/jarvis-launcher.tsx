"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import type { JarvisMessage } from "@/components/jarvis/jarvis-panel";

// The chat window is only downloaded when it is about to be opened.
const JarvisPanel = dynamic(() => import("@/components/jarvis/jarvis-panel"), { ssr: false });

/** Floating assistant button, bottom-right on every public page. */
export function JarvisLauncher({ whatsapp, responseTime }: { whatsapp: string; responseTime: string }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const [messages, setMessages] = useState<JarvisMessage[]>([]);

  // One-time hint bubble per visit.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("assistant:hint") === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    const show = window.setTimeout(() => setHint(true), 4000);
    const hide = window.setTimeout(() => setHint(false), 12000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  // Load the chat bundle shortly after the page settles, so the first open is instant.
  useEffect(() => {
    const t = window.setTimeout(() => void import("@/components/jarvis/jarvis-panel"), 2500);
    return () => window.clearTimeout(t);
  }, []);

  const toggle = () => {
    setOpen((o) => !o);
    setHint(false);
    try {
      sessionStorage.setItem("assistant:hint", "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <JarvisPanel
            key="panel"
            messages={messages}
            setMessages={setMessages}
            onClose={() => setOpen(false)}
            whatsapp={whatsapp}
            responseTime={responseTime}
          />
        )}
      </AnimatePresence>

      <div className={`fixed bottom-5 right-5 z-[85] flex items-end gap-3 sm:bottom-6 sm:right-6 ${open ? "max-md:hidden" : ""}`}>
        <AnimatePresence>
          {hint && !open && (
            <motion.button
              type="button"
              onClick={toggle}
              initial={{ opacity: 0, x: 12, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.9 }}
              className="mb-2 hidden rounded-2xl rounded-br-md border border-gray-200/90 bg-surface px-4 py-3 text-left text-sm shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)] sm:block"
            >
              <span className="font-semibold text-gray-900">Hi there 👋</span>
              <br />
              <span className="text-gray-500">Questions about Picode? Ask me.</span>
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={toggle}
          aria-label={open ? "Close assistant" : "Chat with Picode assistant"}
          aria-expanded={open}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.4, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.2 }}
          className="relative flex size-14 items-center justify-center rounded-full bg-gradient-primary text-white shadow-[0_14px_30px_-10px_rgb(var(--color-primary)/0.8)] ring-4 ring-white/70 sm:size-[3.75rem] dark:ring-white/10"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="size-6" />
              </motion.span>
            ) : (
              <motion.span key="chat" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                <MessageCircle className="size-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
