import type { AttendeeStats, Badge } from "../domain/entities/Badge";
import type { AttendeeStatsRepository } from "../application/ports/AttendeeStatsRepository";
import type { BadgeRepository } from "../application/ports/BadgeRepository";
import type { UserBadgeRepository } from "../application/ports/UserBadgeRepository";

export class InMemoryBadgeRepository implements BadgeRepository {
  constructor(private badges: Badge[] = []) {}

  async listActiveForEvent(eventId: string): Promise<Badge[]> {
    return this.badges.filter(
      (b) => b.isActive && (b.eventId === eventId || b.eventId === null),
    );
  }
}

interface AwardRecord {
  userId: string;
  eventId: string;
  badgeId: string;
}

export class InMemoryUserBadgeRepository implements UserBadgeRepository {
  private awards: AwardRecord[] = [];

  constructor(
    seedAwarded: { userId: string; badgeId: string; eventId?: string }[] = [],
  ) {
    for (const a of seedAwarded) {
      this.awards.push({
        userId: a.userId,
        eventId: a.eventId ?? "evt-1",
        badgeId: a.badgeId,
      });
    }
  }

  async awardedBadgeIds(userId: string, eventId: string): Promise<string[]> {
    return this.awards
      .filter((a) => a.userId === userId && a.eventId === eventId)
      .map((a) => a.badgeId);
  }

  async award(
    userId: string,
    eventId: string,
    badgeId: string,
  ): Promise<boolean> {
    // The DB unique is (user_id, badge_id) — a badge is earned once, period.
    if (this.awards.some((a) => a.userId === userId && a.badgeId === badgeId)) {
      return false; // mirrors the 23505 no-op
    }
    this.awards.push({ userId, eventId, badgeId });
    return true;
  }

  async awardCountsForEvent(
    eventId: string,
  ): Promise<{ badgeId: string; count: number }[]> {
    const byBadge = new Map<string, number>();
    for (const a of this.awards) {
      if (a.eventId !== eventId) continue;
      byBadge.set(a.badgeId, (byBadge.get(a.badgeId) ?? 0) + 1);
    }
    return [...byBadge.entries()].map(([badgeId, count]) => ({
      badgeId,
      count,
    }));
  }
}

export class InMemoryAttendeeStatsRepository implements AttendeeStatsRepository {
  constructor(private stats: AttendeeStats) {}

  async getStats(): Promise<AttendeeStats> {
    return this.stats;
  }
}
