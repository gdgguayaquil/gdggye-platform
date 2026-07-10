import "server-only";

import {
  adjustEventPoints as adjustEventPointsUseCase,
  evaluateBadges,
  getRegistrationDetail as getRegistrationDetailUseCase,
  listEventRegistrations as listEventRegistrationsUseCase,
  type AdjustEventPointsInput,
} from "@gdggye/backend-core";
import {
  buildBadgeDeps,
  SupabasePointTransactionRepository,
  SupabaseRegistrationRepository,
  SupabaseScanLogRepository,
  SupabaseUserRepository,
  SystemClock,
} from "@gdggye/supabase-adapters";

import { getSupabaseServerClient, getSupabaseServiceClient } from "./supabase";

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

// The one write in this file. Insert runs under the staff server client
// (pt_staff_adjust RLS policy); the trigger moves the total. A points change
// can push the attendee past a points_total badge threshold, so we re-evaluate
// their badges afterward — best-effort (award needs the service-role client;
// a badge failure must never fail the adjustment).
export async function adjustEventPoints(input: AdjustEventPointsInput) {
  const supabase = await getSupabaseServerClient();
  const result = await adjustEventPointsUseCase(input, {
    pointTxRepo: new SupabasePointTransactionRepository(supabase),
    clock: new SystemClock(),
  });

  try {
    await evaluateBadges(
      input.userId,
      input.eventId,
      buildBadgeDeps(getSupabaseServiceClient()),
    );
  } catch {
    // Non-fatal — the adjustment already landed.
  }

  return result;
}
