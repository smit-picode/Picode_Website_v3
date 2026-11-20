import { NextResponse, type NextRequest } from "next/server";
import { applicationSchema, RESUME_MAX_BYTES, type ApplicationFieldErrors, type ApplyResponse } from "@/lib/content/careers";
import { createApplication, getJob, readResume, ResumeError } from "@/lib/server/careers";
import { sendApplicationNotification } from "@/lib/server/inquiry-email";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = RESUME_MAX_BYTES + 64 * 1024;

function json(body: ApplyResponse, init?: ResponseInit) {
  return NextResponse.json<ApplyResponse>(body, init);
}

/** Job application or general resume submission (multipart/form-data). */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`apply:${ip}`, { limit: 5, windowMs: 30 * 60_000 });
  if (!limit.success) {
    return json({ ok: false, error: "Too many applications from this connection. Please try again later." }, { status: 429 });
  }

  if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
    return json({ ok: false, error: "Expected a form upload." }, { status: 415 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Resumes must be 5 MB or smaller.", fieldErrors: { resume: "Resumes must be 5 MB or smaller." } }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: "We couldn't read that form. Please try again." }, { status: 400 });
  }

  const text = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : "";
  };
  const parsed = applicationSchema.safeParse({
    jobId: text("jobId"),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    city: text("city"),
    country: text("country"),
    experienceYears: text("experienceYears") || "0",
    currentTitle: text("currentTitle"),
    skills: form.getAll("skills").filter((v): v is string => typeof v === "string"),
    languages: form.getAll("languages").filter((v): v is string => typeof v === "string"),
    workMode: text("workMode"),
    noticePeriod: text("noticePeriod"),
    linkedin: text("linkedin"),
    portfolio: text("portfolio"),
    note: text("note"),
    consent: text("consent") === "on",
    website: text("website"),
  });

  const fieldErrors: ApplicationFieldErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ApplicationFieldErrors | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    // Honeypot tripped — pretend success so bots learn nothing.
    if (fieldErrors.website) return json({ ok: true, ref: "PCJ-0000" });
  }

  const file = form.get("resume");
  let resume: Awaited<ReturnType<typeof readResume>> | null = null;
  if (!(file instanceof File) || file.size === 0) {
    fieldErrors.resume = "Attach your resume (PDF or Word, up to 5 MB)";
  } else {
    try {
      resume = await readResume(file);
    } catch (error) {
      fieldErrors.resume = error instanceof ResumeError ? error.message : "We couldn't read that file.";
    }
  }

  if (!parsed.success || !resume) {
    return json({ ok: false, error: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }

  try {
    const job = parsed.data.jobId ? await getJob(parsed.data.jobId, { publishedOnly: true }) : null;
    if (parsed.data.jobId && !job) {
      return json({ ok: false, error: "This role is no longer open. You can still send your resume to our talent pool." }, { status: 410 });
    }
    const application = await createApplication(parsed.data, job, resume, { ip, userAgent: req.headers.get("user-agent") });
    await sendApplicationNotification(application);
    return json({ ok: true, ref: `PCJ-${application.id.slice(0, 6).toUpperCase()}` }, { status: 201 });
  } catch (error) {
    console.error("[careers] Application failed:", error);
    return json({ ok: false, error: "We couldn't send your application right now. Please try again shortly." }, { status: 502 });
  }
}
