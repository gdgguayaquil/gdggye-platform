import type {
  ScanEventSummary,
  ScanHistoryEntry,
  ScanLogRepository,
  ScanResult,
  ScanTargetType,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { AnySupabaseClient } from "../client/types";

const SCAN_COLS =
  "id, event_id, scanner_user_id, target_type, target_id, result, reject_reason, points_granted, scanned_at";

type ScanRow = {
  id: string;
  event_id: string;
  scanner_user_id: string;
  target_type: string;
  target_id: string;
  result: string;
  reject_reason: string | null;
  points_granted: number;
  scanned_at: string;
};

function rowToScanHistory(row: ScanRow): ScanHistoryEntry {
  return {
    id: row.id,
    eventId: row.event_id,
    scannerUserId: row.scanner_user_id,
    targetType: row.target_type as ScanTargetType,
    targetId: row.target_id,
    result: row.result as ScanResult,
    rejectReason: row.reject_reason,
    pointsGranted: row.points_granted,
    scannedAt: new Date(row.scanned_at),
  };
}

// Read-only scan_logs access for the admin console. Separate from
// SupabaseScanRepository (the service-role WRITE port): these reads run under
// the staff-scoped server client, allowed by scan_self_read's is_staff()
// branch. No point mutation happens here.
export class SupabaseScanLogRepository implements ScanLogRepository {
  private readonly client: AnySupabaseClient;
  constructor(client: SupabaseServerClient | SupabaseServiceClient) {
    this.client = client as AnySupabaseClient;
  }

  async listForUser(
    eventId: string,
    userId: string,
  ): Promise<ScanHistoryEntry[]> {
    const { data, error } = await this.client
      .from("scan_logs")
      .select(SCAN_COLS)
      .eq("event_id", eventId)
      .eq("scanner_user_id", userId)
      .order("scanned_at", { ascending: false });
    if (error)
      throw new Error(
        `SupabaseScanLogRepository.listForUser: ${error.message}`,
      );
    return (data ?? []).map(rowToScanHistory);
  }

  async listByEvent(
    eventId: string,
    limit: number,
  ): Promise<ScanHistoryEntry[]> {
    const { data, error } = await this.client
      .from("scan_logs")
      .select(SCAN_COLS)
      .eq("event_id", eventId)
      .order("scanned_at", { ascending: false })
      .limit(limit);
    if (error)
      throw new Error(
        `SupabaseScanLogRepository.listByEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToScanHistory);
  }

  // accepted total via a head-only exact count (no row transfer). Rejected
  // rows are fetched (reason only) so the breakdown aggregates in memory —
  // rejected is the smaller set and the breakdown needs the reasons anyway.
  async summaryForEvent(eventId: string): Promise<ScanEventSummary> {
    const [acceptedRes, rejectedRes] = await Promise.all([
      this.client
        .from("scan_logs")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("result", "accepted"),
      this.client
        .from("scan_logs")
        .select("reject_reason")
        .eq("event_id", eventId)
        .eq("result", "rejected"),
    ]);
    if (acceptedRes.error)
      throw new Error(
        `SupabaseScanLogRepository.summaryForEvent (accepted): ${acceptedRes.error.message}`,
      );
    if (rejectedRes.error)
      throw new Error(
        `SupabaseScanLogRepository.summaryForEvent (rejected): ${rejectedRes.error.message}`,
      );

    const byReason = new Map<string, number>();
    for (const row of rejectedRes.data ?? []) {
      const reason = row.reject_reason ?? "unknown";
      byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
    }

    return {
      accepted: acceptedRes.count ?? 0,
      rejected: rejectedRes.data?.length ?? 0,
      rejectReasons: [...byReason.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
