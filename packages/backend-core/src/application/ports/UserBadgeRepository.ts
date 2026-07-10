export interface UserBadgeRepository {
  // Badge ids this user has already earned for this event.
  awardedBadgeIds(userId: string, eventId: string): Promise<string[]>;

  // Idempotently award a badge. Returns true if this call created the award,
  // false if it already existed (the unique(user_id, badge_id) index makes a
  // concurrent duplicate a no-op — the adapter swallows 23505 → false).
  award(userId: string, eventId: string, badgeId: string): Promise<boolean>;

  // How many attendees have earned each badge at this event. Admin read
  // (badge stats). Badges with zero awards are simply absent from the result.
  awardCountsForEvent(
    eventId: string,
  ): Promise<{ badgeId: string; count: number }[]>;
}
