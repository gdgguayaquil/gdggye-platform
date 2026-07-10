import "server-only";

import { getEventBadgeStats as getEventBadgeStatsUseCase } from "@gdggye/backend-core";
import {
  SupabaseBadgeRepository,
  SupabaseUserBadgeRepository,
} from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

// Read-only: badge definitions are public-read; the award counts read behind
// user_badges_self_read's is_staff branch. No writes (badges are seed-driven
// in v1 — admin CRUD is a later stretch goal).
export async function getEventBadgeStats(eventId: string) {
  const supabase = await getSupabaseServerClient();
  return getEventBadgeStatsUseCase(eventId, {
    badgeRepo: new SupabaseBadgeRepository(supabase),
    userBadgeRepo: new SupabaseUserBadgeRepository(supabase),
  });
}
