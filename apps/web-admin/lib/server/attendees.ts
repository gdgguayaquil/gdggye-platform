import "server-only";

import {
  getRegistrationDetail as getRegistrationDetailUseCase,
  listEventRegistrations as listEventRegistrationsUseCase,
} from "@gdggye/backend-core";
import {
  SupabasePointTransactionRepository,
  SupabaseRegistrationRepository,
  SupabaseScanLogRepository,
  SupabaseUserRepository,
} from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

// All reads run under the staff-scoped server client. The RLS staff branches
// (reg_self_read, pt_self_read, scan_self_read — all `or public.is_staff()`)
// authorize a signed-in organizer to see any attendee's rows for the event.
async function deps() {
  const supabase = await getSupabaseServerClient();
  return {
    registrationRepo: new SupabaseRegistrationRepository(supabase),
    userRepo: new SupabaseUserRepository(supabase),
    pointTxRepo: new SupabasePointTransactionRepository(supabase),
    scanLogRepo: new SupabaseScanLogRepository(supabase),
  };
}

export async function listEventRegistrations(eventId: string) {
  const d = await deps();
  return listEventRegistrationsUseCase(eventId, {
    registrationRepo: d.registrationRepo,
    userRepo: d.userRepo,
  });
}

export async function getRegistrationDetail(eventId: string, userId: string) {
  return getRegistrationDetailUseCase(eventId, userId, await deps());
}
