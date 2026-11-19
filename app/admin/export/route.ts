import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/auth";
import { listInquiries } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Escape a CSV cell and neutralise spreadsheet formula injection. */
function cell(value: string | undefined | null) {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listInquiries();
  const header = ["Received", "Status", "Name", "Email", "Company", "Building", "Stage", "Timeline", "Budget", "Message"];
  const csv = [
    header.map(cell).join(","),
    ...rows.map((q) =>
      [
        q.receivedAt,
        q.status,
        q.name,
        q.email,
        q.company,
        q.brief?.types.join("; "),
        q.brief?.stage,
        q.brief?.timeline,
        q.brief?.budget,
        q.message,
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\r\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="picode-inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
