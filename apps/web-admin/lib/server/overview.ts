import "server-only";

import { getEventOverview as getEventOverviewUseCase } from "@gdggye/backend-core";
import {
  SupabaseRegistrationRepository,
  SupabaseScanLogRepository,
} from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

// Composes the registration + scan reads under the staff server client.
export async function getEventOverview(eventId: string) {
  const supabase = await getSupabaseServerClient();
  return getEventOverviewUseCase(eventId, {
    registrationRepo: new SupabaseRegistrationRepository(supabase),
    scanLogRepo: new SupabaseScanLogRepository(supabase),
  });
}
