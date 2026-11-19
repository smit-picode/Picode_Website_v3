"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaveButton({ label = "Save changes" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      leftIcon={pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
    >
      {pending ? "Saving…" : label}
    </Button>
  );
}

/** Shows a success message for a few seconds whenever `message` changes. */
export function SavedToast({ message, stamp }: { message?: string; stamp: unknown }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 3500);
    return () => window.clearTimeout(t);
  }, [message, stamp]);

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-success"
        >
          <CheckCircle2 className="size-4" aria-hidden /> {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
