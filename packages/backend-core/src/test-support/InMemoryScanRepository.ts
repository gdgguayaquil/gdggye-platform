import { ScanRejected } from "../domain/errors/ScanRejected";
import type {
  RecordAcceptedScanInput,
  RecordRejectedScanInput,
  ScanRepository,
} from "../application/ports/ScanRepository";
import type { ScanTargetType } from "../application/ports/ScanTargetRepository";

interface AcceptedRow {
  eventId: string;
  scannerUserId: string;
  targetType: ScanTargetType;
  targetId: string;
  points: number;
}

interface RejectedRow {
  eventId: string;
  scannerUserId: string;
  targetType: ScanTargetType;
  targetId: string;
  reason: string;
}

// Mirrors the adapter's semantics: the unique index on (event_id,
// scanner_user_id, target_type, target_id) where result='accepted' means
// a duplicate accepted insert throws ScanRejected("already_claimed").
export class InMemoryScanRepository implements ScanRepository {
  readonly accepted: AcceptedRow[] = [];
  readonly rejected: RejectedRow[] = [];
  private totals = new Map<string, number>();

  // Test hook: force the next recordAcceptedScan to raise
  // ScanRejected("already_claimed") to simulate the race that the DB
  // unique index catches after hasAcceptedScan already returned false.
  raceOnNextAccept = false;

  // Test hook: force recordRejectedScan to throw. The use-case must
  // swallow this so the original rejection surfaces cleanly.
  failOnReject = false;

  async hasAcceptedScan(
    eventId: string,
    scannerUserId: string,
    targetType: ScanTargetType,
    targetId: string,
  ): Promise<boolean> {
    return this.accepted.some(
      (r) =>
        r.eventId === eventId &&
        r.scannerUserId === scannerUserId &&
        r.targetType === targetType &&
        r.targetId === targetId,
    );
  }

  async recordAcceptedScan(input: RecordAcceptedScanInput): Promise<number> {
    if (this.raceOnNextAccept) {
      this.raceOnNextAccept = false;
      throw new ScanRejected("already_claimed");
    }
    this.accepted.push({ ...input });
    const key = `${input.eventId}:${input.scannerUserId}`;
    const next = (this.totals.get(key) ?? 0) + input.points;
    this.totals.set(key, next);
    return next;
  }

  async recordRejectedScan(input: RecordRejectedScanInput): Promise<void> {
    if (this.failOnReject) {
      throw new Error("rejected log write failed");
    }
    this.rejected.push({ ...input });
  }
}
