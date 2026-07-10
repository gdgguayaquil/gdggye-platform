import type { Badge } from "../../../domain/entities/Badge";
import type { AttendeeStatsRepository } from "../../ports/AttendeeStatsRepository";
import type { BadgeRepository } from "../../ports/BadgeRepository";
import type { UserBadgeRepository } from "../../ports/UserBadgeRepository";

export interface BadgeProgress {
  badge: Badge;
  earned: boolean;
  current: number; // tally toward the threshold (capped at threshold)
  threshold: number;
}

export interface GetMyBadgesDeps {
  badgeRepo: BadgeRepository;
  userBadgeRepo: UserBadgeRepository;
  statsRepo: AttendeeStatsRepository;
}

// Read model for /my-badges: every active badge for the event with the user's
// earned flag and progress. Earned badges sort first, then by how close the
// locked ones are to earning (nearest first) so the UI reads as a ladder.
export async function getMyBadges(
  userId: string,
  eventId: string,
  deps: GetMyBadgesDeps,
): Promise<BadgeProgress[]> {
  const [badges, awardedIds, stats] = await Promise.all([
    deps.badgeRepo.listActiveForEvent(eventId),
    deps.userBadgeRepo.awardedBadgeIds(userId, eventId),
    deps.statsRepo.getStats(userId, eventId),
  ]);
  const earned = new Set(awardedIds);

  const rows: BadgeProgress[] = badges.map((badge) => ({
    badge,
    earned: earned.has(badge.id),
    current: Math.min(stats[badge.criteriaType], badge.threshold),
    threshold: badge.threshold,
  }));

  return rows.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    // Locked: nearest to completion first (higher ratio).
    const ra = a.current / a.threshold;
    const rb = b.current / b.threshold;
    return rb - ra;
  });
}

// Convenience for the badge-earned toast: turn a Badge into the minimal shape.
export function badgeLabel(badge: Badge): {
  name: string;
  icon: string | null;
} {
  return { name: badge.name, icon: badge.icon };
}
