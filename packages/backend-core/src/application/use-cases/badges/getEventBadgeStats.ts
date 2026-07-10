import type { Badge } from "../../../domain/entities/Badge";
import type { BadgeRepository } from "../../ports/BadgeRepository";
import type { UserBadgeRepository } from "../../ports/UserBadgeRepository";

export interface BadgeAwardStat {
  badge: Badge;
  awarded: number; // distinct attendees who earned it at this event
}

export interface GetEventBadgeStatsDeps {
  badgeRepo: BadgeRepository;
  userBadgeRepo: UserBadgeRepository;
}

// Epic (5.4). Per-event badge definitions with how many attendees earned each,
// most-earned first. Admin read — quiet register. Global badges (event_id null)
// are included; their award count is scoped to this event's user_badges rows.
export async function getEventBadgeStats(
  eventId: string,
  deps: GetEventBadgeStatsDeps,
): Promise<BadgeAwardStat[]> {
  const [badges, counts] = await Promise.all([
    deps.badgeRepo.listActiveForEvent(eventId),
    deps.userBadgeRepo.awardCountsForEvent(eventId),
  ]);
  const countById = new Map(counts.map((c) => [c.badgeId, c.count]));

  return badges
    .map((badge) => ({ badge, awarded: countById.get(badge.id) ?? 0 }))
    .sort(
      (a, b) => b.awarded - a.awarded || a.badge.threshold - b.badge.threshold,
    );
}
