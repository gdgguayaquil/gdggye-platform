import { describe, expect, it } from "vitest";

import type { Badge } from "../../../domain/entities/Badge";
import {
  InMemoryBadgeRepository,
  InMemoryUserBadgeRepository,
} from "../../../test-support/InMemoryBadgeRepositories";
import { getEventBadgeStats } from "./getEventBadgeStats";

const EVENT = "evt-1";

function badge(id: string, threshold: number): Badge {
  return {
    id,
    eventId: EVENT,
    key: id,
    name: id,
    description: null,
    icon: null,
    criteriaType: "networking_scans",
    threshold,
    isActive: true,
  };
}

describe("getEventBadgeStats", () => {
  it("counts awards per badge, most-earned first, and includes zero-award badges", async () => {
    const badgeRepo = new InMemoryBadgeRepository([
      badge("connector", 5),
      badge("explorer", 5),
      badge("rare", 99),
    ]);
    const userBadgeRepo = new InMemoryUserBadgeRepository([
      { userId: "u1", badgeId: "connector", eventId: EVENT },
      { userId: "u2", badgeId: "connector", eventId: EVENT },
      { userId: "u3", badgeId: "explorer", eventId: EVENT },
    ]);

    const stats = await getEventBadgeStats(EVENT, { badgeRepo, userBadgeRepo });

    expect(stats.map((s) => [s.badge.id, s.awarded])).toEqual([
      ["connector", 2],
      ["explorer", 1],
      ["rare", 0],
    ]);
  });

  it("does not count awards from a different event", async () => {
    const badgeRepo = new InMemoryBadgeRepository([badge("connector", 5)]);
    const userBadgeRepo = new InMemoryUserBadgeRepository([
      { userId: "u1", badgeId: "connector", eventId: "other-event" },
    ]);
    const stats = await getEventBadgeStats(EVENT, { badgeRepo, userBadgeRepo });
    expect(stats[0]!.awarded).toBe(0);
  });
});
