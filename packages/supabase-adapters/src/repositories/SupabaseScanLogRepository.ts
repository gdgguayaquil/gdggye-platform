import type {
  ScanHistoryEntry,
  ScanLogRepository,
  ScanResult,
  ScanTargetType,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { AnySupabaseClient } from "../client/types";

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
      .select(
        "id, event_id, scanner_user_id, target_type, target_id, result, reject_reason, points_granted, scanned_at",
      )
      .eq("event_id", eventId)
      .eq("scanner_user_id", userId)
      .order("scanned_at", { ascending: false });
    if (error)
      throw new Error(
        `SupabaseScanLogRepository.listForUser: ${error.message}`,
      );
    return (data ?? []).map((row) => ({
      id: row.id,
      eventId: row.event_id,
      scannerUserId: row.scanner_user_id,
      targetType: row.target_type as ScanTargetType,
      targetId: row.target_id,
      result: row.result as ScanResult,
      rejectReason: row.reject_reason,
      pointsGranted: row.points_granted,
      scannedAt: new Date(row.scanned_at),
    }));
  }
}
