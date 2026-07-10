import "server-only";

import { getMyBadges as getMyBadgesUseCase } from "@gdggye/backend-core";
import {
  SupabaseAttendeeStatsRepository,
  SupabaseBadgeRepository,
  SupabaseUserBadgeRepository,
} from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

// Reads only — badges are public-read, the user's awards + tallies are
// covered by self-read RLS, so the user-scoped client is enough (no
// service-role). Awards are never written here (that's the scan path).
export async function getMyBadges(eventId: string, userId: string) {
  const supabase = await getSupabaseServerClient();
  return getMyBadgesUseCase(userId, eventId, {
    badgeRepo: new SupabaseBadgeRepository(supabase),
    userBadgeRepo: new SupabaseUserBadgeRepository(supabase),
    statsRepo: new SupabaseAttendeeStatsRepository(supabase),
  });
}
