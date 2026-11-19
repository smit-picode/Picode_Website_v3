import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";
import { SAMPLE_RATE, speakText } from "@/lib/server/jarvis-voice";

/**
 * Streams Jarvis's natural voice for one reply (see lib/server/jarvis-voice).
 *
 * Response: newline-delimited JSON, sent as it is produced:
 *   {"rate":24000}            first line: PCM format
 *   {"a":"<base64 PCM16>"}    an audio chunk (mono, little-endian)
 *   {"t":"words"}             transcript of what is being said
 *   {"done":true}             finished   |   {"error":"…"} could not speak
 * 503 when no voice is configured: the panel then uses the browser's voice.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ text: z.string().trim().min(1).max(2000) });

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Voice unavailable" }, { status: 503 });

  const ip = getClientIp(req.headers);
  const limit = rateLimit(`jarvis-voice:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!limit.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let parsed;
  try {
    parsed = schema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const text = parsed.data.text;

  const ctrl = new AbortController();
  req.signal.addEventListener("abort", () => ctrl.abort()); // visitor interrupted or closed the panel
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        if (ctrl.signal.aborted) return;
        try {
          controller.enqueue(enc.encode(`${JSON.stringify(obj)}\n`));
        } catch {
          ctrl.abort();
        }
      };
      send({ rate: SAMPLE_RATE });
      try {
        const ok = await speakText(
          text,
          (e) => ("audio" in e ? send({ a: e.audio.toString("base64") }) : send({ t: e.text })),
          ctrl.signal,
        );
        send(ok ? { done: true } : { error: "Voice unavailable" });
      } catch (error) {
        console.warn("[jarvis-voice] failed:", (error as Error).message);
        send({ error: "Voice unavailable" });
      }
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
    cancel() {
      ctrl.abort();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
