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

export class InMemoryUserBadgeRepository implements UserBadgeRepository {
  // key: `${userId}:${badgeId}`
  private awards = new Set<string>();

  constructor(seedAwarded: { userId: string; badgeId: string }[] = []) {
    for (const a of seedAwarded) this.awards.add(`${a.userId}:${a.badgeId}`);
  }

  async awardedBadgeIds(userId: string): Promise<string[]> {
    const prefix = `${userId}:`;
    return [...this.awards]
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
  }

  async award(
    userId: string,
    _eventId: string,
    badgeId: string,
  ): Promise<boolean> {
    const key = `${userId}:${badgeId}`;
    if (this.awards.has(key)) return false; // mirrors the 23505 no-op
    this.awards.add(key);
    return true;
  }
}

export class InMemoryAttendeeStatsRepository implements AttendeeStatsRepository {
  constructor(private stats: AttendeeStats) {}

  async getStats(): Promise<AttendeeStats> {
    return this.stats;
  }
}
