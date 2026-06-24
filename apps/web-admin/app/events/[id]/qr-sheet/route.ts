import "server-only";

import { NextResponse } from "next/server";

import { listActivitiesForEvent } from "@/lib/server/activities";
import { requireStaff } from "@/lib/server/auth";
import { listAttachedSponsors } from "@/lib/server/event-sponsors";
import { findEventById } from "@/lib/server/events";
import { generateQrSheetPdf } from "@/lib/server/qr-pdf";

// GET /events/[id]/qr-sheet
// Staff-only. Builds a printable PDF of every active sponsor + activity QR
// for the event. Each QR carries a signed token verifiable with
// QR_SIGNING_SECRET in the Sprint 4 scanner.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireStaff();
  const { id } = await params;

  const [event, attached, activities] = await Promise.all([
    findEventById(id),
    listAttachedSponsors(id),
    listActivitiesForEvent(id),
  ]);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await generateQrSheetPdf(event, attached, activities);
  const filename = `${event.slug}-qr-sheet.pdf`;

  return new NextResponse(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
