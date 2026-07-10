import { describe, expect, it } from "vitest";

import type { AttendeeStats, Badge } from "../../../domain/entities/Badge";
import {
  InMemoryAttendeeStatsRepository,
  InMemoryBadgeRepository,
  InMemoryUserBadgeRepository,
} from "../../../test-support/InMemoryBadgeRepositories";
import { getMyBadges } from "./getMyBadges";

const EVENT = "evt-1";
const USER = "u1";

function badge(
  id: string,
  criteriaType: Badge["criteriaType"],
  threshold: number,
): Badge {
  return {
    id,
    eventId: EVENT,
    key: id,
    name: id,
    description: null,
    icon: null,
    criteriaType,
    threshold,
    isActive: true,
  };
}

const stats: AttendeeStats = {
  points_total: 40,
  sponsor_scans: 3,
  activity_scans: 0,
  networking_scans: 5,
  precheckin_approved: 0,
};

describe("getMyBadges", () => {
  it("reports earned + progress, earned first then nearest-to-complete", async () => {
    const rows = await getMyBadges(USER, EVENT, {
      badgeRepo: new InMemoryBadgeRepository([
        badge("connector", "networking_scans", 5), // 5/5 → will be earned
        badge("explorer", "sponsor_scans", 5), //   3/5 → 60%
        badge("centurion", "points_total", 100), //  40/100 → 40%
      ]),
      userBadgeRepo: new InMemoryUserBadgeRepository([
        { userId: USER, badgeId: "connector" },
      ]),
      statsRepo: new InMemoryAttendeeStatsRepository(stats),
    });

    expect(rows.map((r) => r.badge.id)).toEqual([
      "connector", // earned first
      "explorer", // 60% locked
      "centurion", // 40% locked
    ]);
    expect(rows[0]).toMatchObject({ earned: true, current: 5, threshold: 5 });
    expect(rows[1]).toMatchObject({ earned: false, current: 3, threshold: 5 });
  });

  it("caps progress at the threshold", async () => {
    const rows = await getMyBadges(USER, EVENT, {
      badgeRepo: new InMemoryBadgeRepository([
        badge("first", "networking_scans", 1), // stat 5, threshold 1
      ]),
      userBadgeRepo: new InMemoryUserBadgeRepository(),
      statsRepo: new InMemoryAttendeeStatsRepository(stats),
    });
    expect(rows[0]!.current).toBe(1);
  });
});
