import { NextResponse, type NextRequest } from "next/server";
import { deliverContactSubmission } from "@/lib/server/contact-service";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";
import {
  contactSchema,
  type ContactFieldErrors,
  type ContactResponse,
} from "@/lib/validations/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;

function json(body: ContactResponse, init?: ResponseInit) {
  return NextResponse.json<ContactResponse>(body, init);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  const limit = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limit.success) {
    return json(
      { ok: false, error: "Too many requests. Please try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "Expected application/json" }, { status: 415 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: ContactFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactFieldErrors | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    // Honeypot tripped — pretend success so bots don't learn anything.
    if (fieldErrors.website) {
      return json({ ok: true, id: "ignored" }, { status: 200 });
    }
    return json(
      { ok: false, error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  try {
    const submission = await deliverContactSubmission(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent"),
    });
    return json({ ok: true, id: submission.id }, { status: 201 });
  } catch (error) {
    console.error("[contact] Delivery failed:", error);
    return json(
      { ok: false, error: "We couldn't send your message right now. Please try again shortly." },
      { status: 502 },
    );
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
