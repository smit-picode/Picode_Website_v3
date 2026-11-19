"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion, useAnimationControls, useMotionTemplate, useMotionValue } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, User } from "lucide-react";
import { loginAction, type FormState } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileHover={{ scale: pending ? 1 : 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-primary font-display text-sm font-semibold text-white shadow-glow transition-opacity disabled:opacity-80"
    >
      {/* sheen sweep */}
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-[left,opacity] duration-700 group-hover:left-[110%] group-hover:opacity-100"
      />
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span
            key="p"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden /> Verifying…
          </motion.span>
        ) : (
          <motion.span
            key="i"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2"
          >
            Sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  children,
  trailing,
  filled,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
  trailing?: ReactNode;
  filled: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "group relative flex h-14 items-center rounded-xl border bg-gray-50 transition-[border-color,box-shadow,background-color] duration-300",
          "focus-within:border-primary/70 focus-within:bg-surface focus-within:shadow-[0_0_0_4px_rgb(var(--color-primary)/0.12)]",
          error ? "border-danger/60" : "border-gray-200 hover:border-gray-300",
        )}
      >
        <span className="pl-4 text-gray-400 transition-colors group-focus-within:text-primary-strong">{icon}</span>
        <div className="relative h-full flex-1">
          <label
            htmlFor={id}
            className={cn(
              "pointer-events-none absolute left-3 origin-left font-display text-gray-500 transition-all duration-200",
              filled
                ? "top-2 text-[0.6875rem] font-semibold"
                : "top-1/2 -translate-y-1/2 text-[0.9375rem] group-focus-within:top-2 group-focus-within:translate-y-0 group-focus-within:text-[0.6875rem] group-focus-within:font-semibold",
              "group-focus-within:text-primary-strong",
            )}
          >
            {label}
          </label>
          {children}
        </div>
        {trailing}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-1.5 text-xs font-medium text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputClass =
  "absolute inset-0 h-full w-full bg-transparent px-3 pb-1.5 pt-5 text-[0.9375rem] text-gray-900 outline-none placeholder:text-transparent focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState<FormState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const shake = useAnimationControls();
  const firstRender = useRef(true);

  // Cursor-following spotlight on the card.
  const mx = useMotionValue(50);
  const my = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, rgb(var(--color-primary) / 0.14), transparent 60%)`;
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  // Shake the card on a failed attempt.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.error || state.fieldErrors)
      void shake.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.45 } });
  }, [state, shake]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[26rem]"
    >
      <motion.div
        animate={shake}
        onPointerMove={onMove}
        className="relative overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-surface p-7 shadow-float sm:p-9"
      >
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: spotlight }} />
        {/* animated top edge */}
        <motion.span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ backgroundPositionX: ["-200%", "200%"] }}
          style={{ backgroundSize: "50% 100%", backgroundRepeat: "no-repeat" }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative">
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
            className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow"
          >
            <ShieldCheck className="size-6" aria-hidden />
          </motion.span>
          <h1 className="mt-5 font-display text-[1.75rem] font-semibold leading-tight text-gray-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to the Picode admin console.</p>

          <form action={action} className="mt-7 space-y-4" noValidate>
            <input type="hidden" name="next" value={next ?? ""} />

            <Field
              id="email"
              label="Username"
              icon={<User className="size-[18px]" />}
              error={state.fieldErrors?.email}
              filled={user.length > 0}
            >
              <input
                id="email"
                name="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="Username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.email)}
                aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
                required
                autoFocus
                className={inputClass}
              />
            </Field>

            <Field
              id="password"
              label="Password"
              icon={<LockKeyhole className="size-[18px]" />}
              error={state.fieldErrors?.password}
              filled={pass.length > 0}
              trailing={
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="mr-2 inline-flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={show ? "hide" : "show"}
                      initial={{ opacity: 0, rotate: -45 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 45 }}
                      transition={{ duration: 0.15 }}
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              }
            >
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyUp={onKey}
                onKeyDown={onKey}
                aria-invalid={Boolean(state.fieldErrors?.password)}
                aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
                required
                className={inputClass}
              />
            </Field>

            <AnimatePresence>
              {caps && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5 text-xs font-medium text-warning"
                >
                  <AlertCircle className="size-3.5" aria-hidden /> Caps Lock is on
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {state.error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 overflow-hidden rounded-xl bg-danger/[0.08] px-4 py-3 text-sm text-danger"
                >
                  <AlertCircle className="size-4 shrink-0" aria-hidden />
                  {state.error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
        </div>
      </motion.div>

      <p className="mt-6 text-center text-xs text-gray-400">Trouble signing in? Contact your Picode administrator.</p>
    </motion.div>
  );
}
