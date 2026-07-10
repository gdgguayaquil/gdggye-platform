import { describe, expect, it } from "vitest";

import type { AttendeeStats, Badge } from "../../../domain/entities/Badge";
import {
  InMemoryAttendeeStatsRepository,
  InMemoryBadgeRepository,
  InMemoryUserBadgeRepository,
} from "../../../test-support/InMemoryBadgeRepositories";
import { evaluateBadges } from "./evaluateBadges";

const EVENT = "evt-1";
const USER = "u1";

function badge(overrides: Partial<Badge> & Pick<Badge, "id">): Badge {
  return {
    eventId: EVENT,
    key: overrides.id,
    name: overrides.id,
    description: null,
    icon: null,
    criteriaType: "networking_scans",
    threshold: 1,
    isActive: true,
    ...overrides,
  };
}

const zeroStats: AttendeeStats = {
  points_total: 0,
  sponsor_scans: 0,
  activity_scans: 0,
  networking_scans: 0,
  precheckin_approved: 0,
};

function setup(
  badges: Badge[],
  stats: Partial<AttendeeStats>,
  seedAwarded: { userId: string; badgeId: string }[] = [],
) {
  return {
    badgeRepo: new InMemoryBadgeRepository(badges),
    userBadgeRepo: new InMemoryUserBadgeRepository(seedAwarded),
    statsRepo: new InMemoryAttendeeStatsRepository({ ...zeroStats, ...stats }),
  };
}

describe("evaluateBadges", () => {
  it("awards a badge once the threshold is met", async () => {
    const deps = setup(
      [
        badge({
          id: "connector",
          criteriaType: "networking_scans",
          threshold: 5,
        }),
      ],
      { networking_scans: 5 },
    );
    const awarded = await evaluateBadges(USER, EVENT, deps);
    expect(awarded.map((a) => a.badgeId)).toEqual(["connector"]);
  });

  it("does not award below the threshold", async () => {
    const deps = setup(
      [
        badge({
          id: "connector",
          criteriaType: "networking_scans",
          threshold: 5,
        }),
      ],
      { networking_scans: 4 },
    );
    expect(await evaluateBadges(USER, EVENT, deps)).toEqual([]);
  });

  it("is idempotent — re-evaluating awards nothing new", async () => {
    const deps = setup(
      [
        badge({
          id: "connector",
          criteriaType: "networking_scans",
          threshold: 5,
        }),
      ],
      { networking_scans: 9 },
    );
    const first = await evaluateBadges(USER, EVENT, deps);
    expect(first).toHaveLength(1);
    const second = await evaluateBadges(USER, EVENT, deps);
    expect(second).toEqual([]);
  });

  it("skips badges already awarded (seeded)", async () => {
    const deps = setup(
      [
        badge({
          id: "checkin",
          criteriaType: "precheckin_approved",
          threshold: 1,
        }),
      ],
      { precheckin_approved: 1 },
      [{ userId: USER, badgeId: "checkin" }],
    );
    expect(await evaluateBadges(USER, EVENT, deps)).toEqual([]);
  });

  it("evaluates multiple criteria types and awards all newly met", async () => {
    const deps = setup(
      [
        badge({
          id: "connector",
          criteriaType: "networking_scans",
          threshold: 5,
        }),
        badge({ id: "explorer", criteriaType: "sponsor_scans", threshold: 5 }),
        badge({
          id: "centurion",
          criteriaType: "points_total",
          threshold: 100,
        }),
      ],
      { networking_scans: 6, sponsor_scans: 5, points_total: 40 },
    );
    const awarded = await evaluateBadges(USER, EVENT, deps);
    // connector + explorer met; centurion (40 < 100) not.
    expect(awarded.map((a) => a.badgeId).sort()).toEqual([
      "connector",
      "explorer",
    ]);
  });

  it("considers global (event_id null) badges too", async () => {
    const deps = setup(
      [
        badge({
          id: "global-first",
          eventId: null,
          criteriaType: "networking_scans",
          threshold: 1,
        }),
      ],
      { networking_scans: 1 },
    );
    expect(
      (await evaluateBadges(USER, EVENT, deps)).map((a) => a.badgeId),
    ).toEqual(["global-first"]);
  });
});
