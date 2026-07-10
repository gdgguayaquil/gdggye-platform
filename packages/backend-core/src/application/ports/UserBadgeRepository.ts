export interface UserBadgeRepository {
  // Badge ids this user has already earned for this event.
  awardedBadgeIds(userId: string, eventId: string): Promise<string[]>;

  // Idempotently award a badge. Returns true if this call created the award,
  // false if it already existed (the unique(user_id, badge_id) index makes a
  // concurrent duplicate a no-op — the adapter swallows 23505 → false).
  award(userId: string, eventId: string, badgeId: string): Promise<boolean>;
}
