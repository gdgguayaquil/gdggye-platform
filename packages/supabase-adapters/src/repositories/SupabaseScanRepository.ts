import {
  ScanRejected,
  type RecordAcceptedScanInput,
  type RecordRejectedScanInput,
  type ScanRepository,
  type ScanTargetType,
} from "@gdggye/backend-core";

import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { AnySupabaseClient } from "../client/types";

// Scan writes — service-role only. scan_logs and point_transactions have
// no insert policy for attendees on purpose (see migration 0004 comment).
//
// The order matters: insert scan_logs FIRST so the unique index on
// (event_id, scanner_user_id, target_type, target_id) where result='accepted'
// is the single arbiter of double-claims. If two concurrent requests get past
// the use-case's hasAcceptedScan check, exactly one of them lands the row;
// the other gets PostgreSQL 23505 here and we translate it into a clean
// ScanRejected("already_claimed").
//
// Only after scan_logs succeeds do we write point_transactions, which fires
// the registrations.total_points trigger from migration 0002. We then read
// the new total back to return to the caller.
export class SupabaseScanRepository implements ScanRepository {
  private readonly client: AnySupabaseClient;
  constructor(client: SupabaseServiceClient) {
    this.client = client as AnySupabaseClient;
  }

  async hasAcceptedScan(
    eventId: string,
    scannerUserId: string,
    targetType: ScanTargetType,
    targetId: string,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from("scan_logs")
      .select("id")
      .eq("event_id", eventId)
      .eq("scanner_user_id", scannerUserId)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("result", "accepted")
      .limit(1)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseScanRepository.hasAcceptedScan: ${error.message}`,
      );
    return data !== null;
  }

  async recordAcceptedScan(input: RecordAcceptedScanInput): Promise<number> {
    // 1. Insert the accepted scan_log — the unique index here is the
    //    final race guard.
    const { error: logError } = await this.client.from("scan_logs").insert({
      event_id: input.eventId,
      scanner_user_id: input.scannerUserId,
      target_type: input.targetType,
      target_id: input.targetId,
      points_granted: input.points,
      result: "accepted",
      reject_reason: null,
    });
    if (logError) {
      if (logError.code === "23505") {
        // Lost the race. The other request granted the points; surface
        // the same domain error the use-case throws for the pre-check.
        throw new ScanRejected("already_claimed");
      }
      throw new Error(
        `SupabaseScanRepository.recordAcceptedScan (scan_logs): ${logError.message}`,
      );
    }

    // 2. Insert the point_transaction — trigger updates registrations.
    const sourceType: "sponsor" | "activity" | "networking" =
      input.targetType === "attendee" ? "networking" : input.targetType;
    const { error: ptError } = await this.client
      .from("point_transactions")
      .insert({
        event_id: input.eventId,
        user_id: input.scannerUserId,
        source_type: sourceType,
        source_id: input.targetId,
        points: input.points,
      });
    if (ptError)
      throw new Error(
        `SupabaseScanRepository.recordAcceptedScan (point_transactions): ${ptError.message}`,
      );

    // 3. Read back the new total. The trigger has already fired in the
    //    same statement, so this reflects the new value.
    const { data: reg, error: regError } = await this.client
      .from("registrations")
      .select("total_points")
      .eq("event_id", input.eventId)
      .eq("user_id", input.scannerUserId)
      .maybeSingle();
    if (regError)
      throw new Error(
        `SupabaseScanRepository.recordAcceptedScan (registrations): ${regError.message}`,
      );
    return reg?.total_points ?? input.points;
  }

  async recordRejectedScan(input: RecordRejectedScanInput): Promise<void> {
    const { error } = await this.client.from("scan_logs").insert({
      event_id: input.eventId,
      scanner_user_id: input.scannerUserId,
      target_type: input.targetType,
      target_id: input.targetId,
      points_granted: 0,
      result: "rejected",
      reject_reason: input.reason,
    });
    if (error) {
      // Don't fail the request because logging failed; just surface in
      // server logs for observability triage.
      console.error("SupabaseScanRepository.recordRejectedScan:", error);
    }
  }
}
