import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "picode-website",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
}
