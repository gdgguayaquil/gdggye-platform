import type { ScanTargetType } from "./ScanTargetRepository";

export type ScanResult = "accepted" | "rejected";

// A single scan_logs row for the admin scan history / monitoring reads.
// Distinct from ScanRepository (the service-role WRITE port): these reads
// run under the staff-scoped client, allowed by the scan_self_read policy's
// is_staff() branch. Target names are not resolved here — the caller joins
// against ScanTargetRepository when it wants a human label (Sprint 4.3).
export interface ScanHistoryEntry {
  id: string;
  eventId: string;
  scannerUserId: string;
  targetType: ScanTargetType;
  targetId: string;
  result: ScanResult;
  rejectReason: string | null;
  pointsGranted: number;
  scannedAt: Date;
}

// Roll-up of an event's scan_logs for the monitoring header. accepted/rejected
// are exact totals over ALL rows; rejectReasons is the rejected breakdown so a
// misconfigured QR (everything rejecting the same reason) is obvious.
export interface ScanEventSummary {
  accepted: number;
  rejected: number;
  rejectReasons: { reason: string; count: number }[];
}

export interface ScanLogRepository {
  // Every scan (accepted + rejected) one attendee performed at one event,
  // newest first. Feeds the attendee detail drawer.
  listForUser(eventId: string, userId: string): Promise<ScanHistoryEntry[]>;

  // Recent scans across all attendees for one event, newest first, capped at
  // `limit`. Feeds the scan-monitoring page.
  listByEvent(eventId: string, limit: number): Promise<ScanHistoryEntry[]>;

  // Exact accepted/rejected totals + rejected-reason breakdown for the event.
  summaryForEvent(eventId: string): Promise<ScanEventSummary>;
}
