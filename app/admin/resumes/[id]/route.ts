import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/auth";
import { getResumeFile } from "@/lib/server/careers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only resume download. Resumes are personal data: never public, never cached.
 * `?inline=1` opens PDFs in the browser tab instead of downloading.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response("Not found", { status: 404 });

  const file = await getResumeFile(params.id);
  if (!file) return new Response("Not found", { status: 404 });

  const inline = new URL(req.url).searchParams.get("inline") === "1" && file.mime_type === "application/pdf";
  const ext = file.file_name.split(".").pop() ?? "pdf";
  const nice = `${file.name.replace(/[^\w -]+/g, "").trim().replace(/\s+/g, "-") || "candidate"}-resume.${ext}`;

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${nice}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Downloads get a locked-down sandbox; inline PDFs need the browser's PDF viewer.
      ...(inline ? {} : { "Content-Security-Policy": "default-src 'none'; sandbox" }),
      "X-Robots-Tag": "noindex",
    },
  });
}
