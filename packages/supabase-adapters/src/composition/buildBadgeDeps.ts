import type { EvaluateBadgesDeps } from "@gdggye/backend-core";

import type { SupabaseServiceClient } from "../client/createServiceClient";
import { SupabaseAttendeeStatsRepository } from "../repositories/SupabaseAttendeeStatsRepository";
import { SupabaseBadgeRepository } from "../repositories/SupabaseBadgeRepository";
import { SupabaseUserBadgeRepository } from "../repositories/SupabaseUserBadgeRepository";

// One-call wiring for evaluateBadges. Awards are server-authorized (rule 4),
// so this takes the service-role client — same discipline as buildScanDeps.
export function buildBadgeDeps(
  service: SupabaseServiceClient,
): EvaluateBadgesDeps {
  return {
    badgeRepo: new SupabaseBadgeRepository(service),
    userBadgeRepo: new SupabaseUserBadgeRepository(service),
    statsRepo: new SupabaseAttendeeStatsRepository(service),
  };
}
