"use client";

/**
 * Last-resort error page, used only if the root layout itself fails. It replaces
 * the whole document, so it carries its own <html>/<body> and inline styles.
 * Never shows the underlying error.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, sans-serif", padding: 16, textAlign: "center" }}>
        <main>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", color: "#0d9488" }}>500</p>
          <h1 style={{ fontSize: 32, margin: "12px 0" }}>Internal server error</h1>
          <p style={{ color: "#64748b", maxWidth: 420 }}>Something went wrong on our side. Please try again in a moment.</p>
          {error.digest && <p style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>Reference: {error.digest}</p>}
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, padding: "12px 24px", borderRadius: 999, border: 0, background: "#0d9488", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
