import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { listPublishedEvents } from "@/lib/server/events";

// GET /api/events
// Optional query: ?year=2026
// Returns events with status in (published, live, closed).
export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  const events = await listPublishedEvents(
    year && Number.isFinite(year) ? { year } : {},
  );
  return NextResponse.json({ events });
}
