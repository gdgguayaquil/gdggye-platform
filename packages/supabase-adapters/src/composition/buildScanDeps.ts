import type { ValidateAndRecordScanDeps } from "@gdggye/backend-core";

import type { SupabaseServiceClient } from "../client/createServiceClient";
import { SystemClock } from "../clock/SystemClock";
import { SupabaseEventRepository } from "../repositories/SupabaseEventRepository";
import { SupabaseScanRepository } from "../repositories/SupabaseScanRepository";
import { SupabaseScanTargetRepository } from "../repositories/SupabaseScanTargetRepository";

// One-call wiring for validateAndRecordScan. The route handler stays a
// thin adapter (Rule "Option A discipline") — it does request parsing,
// gets the user from the user-scoped client, then hands the service-role
// client to this builder for the gamification writes.
export function buildScanDeps(
  service: SupabaseServiceClient,
): ValidateAndRecordScanDeps {
  return {
    events: new SupabaseEventRepository(service),
    targets: new SupabaseScanTargetRepository(service),
    scans: new SupabaseScanRepository(service),
    clock: new SystemClock(),
  };
}
