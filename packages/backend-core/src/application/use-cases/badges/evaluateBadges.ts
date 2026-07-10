import type { AwardedBadge } from "../../../domain/entities/Badge";
import type { AttendeeStatsRepository } from "../../ports/AttendeeStatsRepository";
import type { BadgeRepository } from "../../ports/BadgeRepository";
import type { UserBadgeRepository } from "../../ports/UserBadgeRepository";

export interface EvaluateBadgesDeps {
  badgeRepo: BadgeRepository;
  userBadgeRepo: UserBadgeRepository;
  statsRepo: AttendeeStatsRepository;
}

// Runs after a points-changing event (a scan or an admin adjustment). Reads
// the user's tallies once, then awards every not-yet-earned active badge whose
// threshold the user now meets. Idempotent: awarding is guarded by the DB's
// unique(user_id, badge_id) index, and the adapter turns a duplicate into a
// no-op, so a re-run awards nothing new. Returns the newly-earned badges so the
// caller (scan route) can surface them.
export async function evaluateBadges(
  userId: string,
  eventId: string,
  deps: EvaluateBadgesDeps,
): Promise<AwardedBadge[]> {
  const [badges, awardedIds, stats] = await Promise.all([
    deps.badgeRepo.listActiveForEvent(eventId),
    deps.userBadgeRepo.awardedBadgeIds(userId, eventId),
    deps.statsRepo.getStats(userId, eventId),
  ]);

  const alreadyAwarded = new Set(awardedIds);
  const newlyAwarded: AwardedBadge[] = [];

  for (const badge of badges) {
    if (alreadyAwarded.has(badge.id)) continue;
    if (stats[badge.criteriaType] < badge.threshold) continue;

    const created = await deps.userBadgeRepo.award(userId, eventId, badge.id);
    if (created) {
      newlyAwarded.push({
        badgeId: badge.id,
        key: badge.key,
        name: badge.name,
        icon: badge.icon,
      });
    }
  }

  return newlyAwarded;
}
