import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Root 404 (rendered outside the (site) group, so it brings its own navbar). */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <section className="flex min-h-[100svh] items-center pb-20 pt-32">
        <Container className="text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary-strong">
            404
          </p>
          <h1 className="mt-4 text-display-3">
            Page <span className="text-gradient-primary">not found</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-body-md text-gray-500">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <ButtonLink
            href="/"
            size="lg"
            className="mt-10"
            leftIcon={<ArrowLeft className="size-4" aria-hidden />}
          >
            Back to Home
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
