import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/auth";
import { buildExport, SECTIONS, type Section } from "@/lib/server/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /admin/data/export?sections=offices,jobs&files=1 → JSON download. */
export async function GET(req: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const requested = (url.searchParams.get("sections") ?? SECTIONS.join(","))
    .split(",")
    .filter((s): s is Section => (SECTIONS as readonly string[]).includes(s));
  const withFiles = url.searchParams.get("files") === "1";

  const data = await buildExport(requested.length ? requested : [...SECTIONS], withFiles);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="picode-site-export-${stamp}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
