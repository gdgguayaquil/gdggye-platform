import "server-only";

import { listScanLogs as listScanLogsUseCase } from "@gdggye/backend-core";
import {
  SupabaseScanLogRepository,
  SupabaseUserRepository,
} from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

// Reads under the staff-scoped server client (scan_self_read's is_staff
// branch). No writes here — scans are minted only by the attendee scanner.
export async function listScanLogs(eventId: string, limit?: number) {
  const supabase = await getSupabaseServerClient();
  return listScanLogsUseCase(
    eventId,
    {
      scanLogRepo: new SupabaseScanLogRepository(supabase),
      userRepo: new SupabaseUserRepository(supabase),
    },
    limit,
  );
}
