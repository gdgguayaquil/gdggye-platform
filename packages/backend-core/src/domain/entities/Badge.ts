// Domain entity: Badge (Phase 5).
// A declarative achievement definition. `criteriaType` names a tally and
// `threshold` is the value that earns it. The award decision lives in the
// evaluateBadges use-case — this is pure data.

export type BadgeCriteriaType =
  | "points_total"
  | "sponsor_scans"
  | "activity_scans"
  | "networking_scans"
  | "precheckin_approved";

export interface Badge {
  id: string;
  eventId: string | null; // null = global (applies to every event)
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  isActive: boolean;
}

// A user's current tallies for one event, keyed by criteria type so the
// evaluator can look up `stats[badge.criteriaType]` directly.
export type AttendeeStats = Record<BadgeCriteriaType, number>;

// The minimal badge info returned when one is newly earned — enough for the
// scanner/UI to celebrate it without a second read.
export interface AwardedBadge {
  badgeId: string;
  key: string;
  name: string;
  icon: string | null;
}
