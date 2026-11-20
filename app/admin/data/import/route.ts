import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/auth";
import { applyImport, ImportError, SECTIONS, type Section } from "@/lib/server/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 150 * 1024 * 1024;

/** POST multipart: file (export JSON), sections (comma list), mode (merge | replace). */
export async function POST(req: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "That file is too large (max 150 MB)." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't read the upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ ok: false, error: "Choose an export file." }, { status: 400 });

  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return NextResponse.json({ ok: false, error: "That file isn't valid JSON." }, { status: 422 });
  }

  const sections = String(form.get("sections") ?? "")
    .split(",")
    .filter((s): s is Section => (SECTIONS as readonly string[]).includes(s));
  if (!sections.length) return NextResponse.json({ ok: false, error: "Pick at least one section to import." }, { status: 400 });
  const mode = form.get("mode") === "replace" ? "replace" : "merge";

  try {
    const summary = await applyImport(json, sections, mode);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    if (error instanceof ImportError) return NextResponse.json({ ok: false, error: error.message }, { status: 422 });
    console.error("[admin] Import failed:", error);
    return NextResponse.json(
      { ok: false, error: "Import stopped partway. Sections before the error may already be applied; check the server log." },
      { status: 500 },
    );
  }
}
