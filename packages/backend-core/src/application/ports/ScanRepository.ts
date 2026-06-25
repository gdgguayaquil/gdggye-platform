import type { ScanTargetType } from "./ScanTargetRepository";
import type { ScanRejectReason } from "../../domain/errors/ScanRejected";

export interface RecordAcceptedScanInput {
  eventId: string;
  scannerUserId: string;
  targetType: ScanTargetType;
  targetId: string;
  points: number;
}

export interface RecordRejectedScanInput {
  eventId: string;
  scannerUserId: string;
  targetType: ScanTargetType;
  targetId: string;
  reason: ScanRejectReason;
}

// The scan-write port. Inserts here use the service-role client so they
// bypass RLS — gamification writes are server-authorized (Rule 4) and the
// only place the application layer trusts itself to mint points.
export interface ScanRepository {
  hasAcceptedScan(
    eventId: string,
    scannerUserId: string,
    targetType: ScanTargetType,
    targetId: string,
  ): Promise<boolean>;

  // Inserts the accepted scan_log row + point_transaction in one logical
  // unit. The point_transactions trigger updates registrations.total_points,
  // which is what we return. Race with the unique index on
  // scan_logs(event_id, scanner_user_id, target_type, target_id)
  //   where result='accepted' is the final guard — adapter maps a 23505
  // here to ScanRejected("already_claimed") so the use-case can stay
  // ignorant of SQLSTATEs.
  recordAcceptedScan(input: RecordAcceptedScanInput): Promise<number>;

  // Logged for anti-abuse monitoring. Returns void; failures here must
  // never poison the response — the scan was already rejected.
  recordRejectedScan(input: RecordRejectedScanInput): Promise<void>;
}
