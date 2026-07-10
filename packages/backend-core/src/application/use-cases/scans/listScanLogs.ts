import type {
  ScanEventSummary,
  ScanLogRepository,
  ScanResult,
} from "../../ports/ScanLogRepository";
import type { ScanTargetType } from "../../ports/ScanTargetRepository";
import type { UserRepository } from "../../ports/UserRepository";

// One row in the monitoring feed: the raw scan joined with who scanned it.
// Target names are not resolved (kept as type + id) — the reject-reason
// summary is the misconfiguration signal, not the target label.
export interface ScanFeedRow {
  id: string;
  scannerUserId: string;
  scannerName: string;
  scannerEmail: string;
  targetType: ScanTargetType;
  targetId: string;
  result: ScanResult;
  rejectReason: string | null;
  pointsGranted: number;
  scannedAt: Date;
}

export interface ScanFeed {
  rows: ScanFeedRow[];
  summary: ScanEventSummary;
}

export interface ListScanLogsDeps {
  scanLogRepo: ScanLogRepository;
  userRepo: UserRepository;
}

export const DEFAULT_SCAN_FEED_LIMIT = 100;
export const MAX_SCAN_FEED_LIMIT = 500;

// Epic C1. The recent feed and the event-wide summary come from two reads:
// the feed is capped (a busy event writes a lot of rows), the summary is
// exact over all rows. Scanner identity is batch-hydrated to avoid N+1.
export async function listScanLogs(
  eventId: string,
  deps: ListScanLogsDeps,
  limit: number = DEFAULT_SCAN_FEED_LIMIT,
): Promise<ScanFeed> {
  const capped = Math.min(Math.max(limit, 1), MAX_SCAN_FEED_LIMIT);

  const [scans, summary] = await Promise.all([
    deps.scanLogRepo.listByEvent(eventId, capped),
    deps.scanLogRepo.summaryForEvent(eventId),
  ]);

  const scannerIds = [...new Set(scans.map((s) => s.scannerUserId))];
  const users = await deps.userRepo.findManyByIds(scannerIds);
  const userById = new Map(users.map((u) => [u.id, u]));

  const rows: ScanFeedRow[] = scans.map((s) => {
    const user = userById.get(s.scannerUserId);
    return {
      id: s.id,
      scannerUserId: s.scannerUserId,
      scannerName: user?.fullName ?? "",
      scannerEmail: user?.email ?? "",
      targetType: s.targetType,
      targetId: s.targetId,
      result: s.result,
      rejectReason: s.rejectReason,
      pointsGranted: s.pointsGranted,
      scannedAt: s.scannedAt,
    };
  });

  return { rows, summary };
}
