"use client";

import { useEffect } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Shown when a page (website or admin) hits an unexpected error. Deliberately
 * generic: the real error stays in the server log / browser console, never on screen.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[100svh] items-center pb-20 pt-32">
      <Container className="text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary-strong">500</p>
        <h1 className="mt-4 text-display-3">
          Internal <span className="text-gradient-primary">server error</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-body-md text-gray-500">
          Something went wrong on our side. Please try again in a moment.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-gray-400">Reference: {error.digest}</p>}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={reset} leftIcon={<RotateCcw className="size-4" aria-hidden />}>
            Try again
          </Button>
          <ButtonLink href="/" size="lg" variant="outline" leftIcon={<ArrowLeft className="size-4" aria-hidden />}>
            Back to Home
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
