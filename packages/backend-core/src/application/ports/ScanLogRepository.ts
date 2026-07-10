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

export interface ScanLogRepository {
  // Every scan (accepted + rejected) one attendee performed at one event,
  // newest first. Feeds the attendee detail drawer.
  listForUser(eventId: string, userId: string): Promise<ScanHistoryEntry[]>;
}
