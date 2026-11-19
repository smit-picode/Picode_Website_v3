import "server-only";

/**
 * Jarvis's natural voice, the way the desktop Jarvis (Mark LV) speaks.
 *
 * Primary: a short Gemini Live session (the desktop's engine and quota). The
 * model speaks with a human prebuilt voice and STREAMS audio as it goes, so
 * speech starts ~1 s after the request, and it returns a transcript of what
 * it is saying, which the panel uses to keep the text in sync with the voice.
 * It is told it is a voice, not an assistant, so it reads the reply word for
 * word (Live models otherwise tend to answer the text instead of saying it).
 *
 * Fallback: the Gemini TTS models (REST). These sound the same but are slower
 * and, on the free tier, limited to a few requests a day.
 *
 * Nothing here ever reaches the browser except audio and transcript text.
 */

export type VoiceEvent = { audio: Buffer } | { text: string };

const LIVE_MODELS = (process.env.GEMINI_LIVE_MODEL ?? "gemini-3.1-flash-live-preview,gemini-2.5-flash-native-audio-preview-12-2025")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const TTS_MODELS = (process.env.GEMINI_TTS_MODEL ?? "gemini-3.8-flash-lite-tts,gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
/** Same voice as the desktop Jarvis. */
export const VOICE = process.env.JARVIS_VOICE ?? "Charon";
/** Live and the TTS models both return 16-bit mono PCM at 24 kHz. */
export const SAMPLE_RATE = 24_000;

const VOICE_INSTRUCTION =
  "You are a text-to-speech voice, not an assistant. The user message is a script. " +
  "Read it aloud exactly as written, word for word, in its own language, with warm, natural, " +
  "human intonation and pacing, like a friendly person talking to a visitor. " +
  "Do not answer it, comment on it, greet, translate, add or skip anything.";

/** A model that ran out of quota or failed is skipped for a while instead of retried each time. */
const resting = new Map<string, number>();
const isResting = (m: string) => (resting.get(m) ?? 0) > Date.now();
const rest = (m: string, ms: number) => resting.set(m, Date.now() + ms);

/**
 * Speaks `text` through one Live session, calling `onEvent` for each audio
 * chunk and transcript piece as they arrive. Resolves true when the turn
 * completed, false if this model could not speak it (nothing usable sent).
 */
function liveOnce(model: string, text: string, key: string, onEvent: (e: VoiceEvent) => void, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const WS = (globalThis as { WebSocket?: typeof WebSocket }).WebSocket;
    if (!WS) return resolve(false);
    let sentAudio = false;
    let settled = false;
    const ws = new WS(
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(key)}`,
    );
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(firstAudioTimer);
      clearTimeout(turnTimer);
      signal.removeEventListener("abort", onAbort);
      try {
        ws.close();
      } catch {
        /* already closed */
      }
      resolve(ok);
    };
    const onAbort = () => settle(sentAudio);
    signal.addEventListener("abort", onAbort);
    // No audio soon → let the next model try; a stuck turn is cut off.
    const firstAudioTimer = setTimeout(() => !sentAudio && settle(false), 6_000);
    const turnTimer = setTimeout(() => settle(sentAudio), 90_000);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          setup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
            },
            systemInstruction: { parts: [{ text: VOICE_INSTRUCTION }] },
            outputAudioTranscription: {},
          },
        }),
      );
    };
    ws.onmessage = async (event) => {
      try {
        const raw = typeof event.data === "string" ? event.data : Buffer.from(await (event.data as Blob).arrayBuffer()).toString("utf8");
        const msg = JSON.parse(raw) as {
          setupComplete?: unknown;
          serverContent?: {
            modelTurn?: { parts?: { inlineData?: { data?: string } }[] };
            outputTranscription?: { text?: string };
            turnComplete?: boolean;
          };
        };
        if (msg.setupComplete) {
          ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true } }));
          return;
        }
        const sc = msg.serverContent;
        for (const part of sc?.modelTurn?.parts ?? []) {
          if (part.inlineData?.data) {
            sentAudio = true;
            onEvent({ audio: Buffer.from(part.inlineData.data, "base64") });
          }
        }
        if (sc?.outputTranscription?.text) onEvent({ text: sc.outputTranscription.text });
        if (sc?.turnComplete) setTimeout(() => settle(true), 250); // the transcript can trail the audio a beat
      } catch {
        /* ignore a malformed frame */
      }
    };
    ws.onerror = () => settle(sentAudio);
    ws.onclose = (e) => {
      // 1011/1008/quota closes: rest this model for a bit.
      if (!sentAudio && e.code !== 1000) {
        rest(model, /quota|exhaust|429/i.test(e.reason ?? "") ? 5 * 60_000 : 30_000);
        console.warn(`[jarvis-voice] ${model} closed ${e.code} ${e.reason ?? ""}`.trim());
      }
      settle(sentAudio);
    };
  });
}

/** Strips a WAV header if present, returning raw PCM. */
function pcmFrom(bytes: Buffer) {
  return bytes.subarray(0, 4).toString("latin1") === "RIFF" ? bytes.subarray(44) : bytes;
}

async function ttsOnce(model: string, text: string, key: string, signal: AbortSignal): Promise<Buffer | null> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 429) rest(model, 10 * 60_000);
    console.warn(`[jarvis-voice] ${model} → HTTP ${res.status}`);
    return null;
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
  const b64 = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  return b64 ? pcmFrom(Buffer.from(b64, "base64")) : null;
}

/**
 * Speaks `text`, streaming events to `onEvent`. Tries Live models first, then
 * the TTS models. Resolves false if no engine could speak (the panel then
 * uses the browser's voice).
 */
export async function speakText(text: string, onEvent: (e: VoiceEvent) => void, signal: AbortSignal): Promise<boolean> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return false;
  for (const model of LIVE_MODELS) {
    if (signal.aborted) return false;
    if (isResting(model)) continue;
    let sent = false;
    const ok = await liveOnce(model, text, key, (e) => {
      if ("audio" in e) sent = true;
      onEvent(e);
    }, signal);
    if (ok || sent) return true; // once audio went out, don't start over with another voice
    rest(model, 30_000);
  }
  for (const model of TTS_MODELS) {
    if (signal.aborted) return false;
    if (isResting(model)) continue;
    try {
      const pcm = await ttsOnce(model, text, key, signal);
      if (pcm) {
        // No live transcript from these models: the panel paces the text by the audio clock instead.
        onEvent({ audio: pcm });
        return true;
      }
    } catch (error) {
      console.warn(`[jarvis-voice] ${model} failed:`, (error as Error).message);
    }
  }
  return false;
}
