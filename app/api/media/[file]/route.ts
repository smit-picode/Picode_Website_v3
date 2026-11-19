import { promises as fs } from "node:fs";
import { resolveMedia } from "@/lib/server/media";

export const runtime = "nodejs";

/** Serves images uploaded from the admin panel. File names are random UUIDs, so they're cacheable forever. */
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const media = resolveMedia(params.file);
  if (!media) return new Response("Not found", { status: 404 });

  try {
    const data = await fs.readFile(media.file);
    return new Response(data, {
      headers: {
        "Content-Type": media.type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
