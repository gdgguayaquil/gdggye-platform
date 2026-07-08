import { describe, expect, it } from "vitest";

import type {
  LeaderboardEntry,
  PointBreakdownItem,
} from "../../../domain/entities/Leaderboard";
import { InMemoryLeaderboardRepository } from "../../../test-support/InMemoryLeaderboardRepository";
import {
  DEFAULT_LEADERBOARD_LIMIT,
  getEventLeaderboard,
  getMyEventStats,
} from "./leaderboardUseCases";

function makeEntry(
  overrides: Partial<LeaderboardEntry> = {},
): LeaderboardEntry {
  return {
    userId: "user-a",
    fullName: "Ada Lovelace",
    photoUrl: null,
    totalPoints: 100,
    rank: 1,
    ...overrides,
  };
}

const ENTRIES: LeaderboardEntry[] = [
  makeEntry({ userId: "u1", rank: 1, totalPoints: 100 }),
  makeEntry({ userId: "u2", rank: 2, totalPoints: 90 }),
  makeEntry({ userId: "u3", rank: 3, totalPoints: 80 }),
];

describe("getEventLeaderboard", () => {
  it("returns the top-N entries", async () => {
    const repo = new InMemoryLeaderboardRepository(ENTRIES);
    const out = await getEventLeaderboard(
      "evt-1",
      { leaderboardRepo: repo },
      2,
    );
    expect(out).toHaveLength(2);
    expect(out.map((e) => e.userId)).toEqual(["u1", "u2"]);
  });

  it("clamps a zero limit to 1 (belt-and-suspenders vs the RPC)", async () => {
    const repo = new InMemoryLeaderboardRepository(ENTRIES);
    const out = await getEventLeaderboard(
      "evt-1",
      { leaderboardRepo: repo },
      0,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.userId).toBe("u1");
  });

  it("clamps a negative limit to 1", async () => {
    const repo = new InMemoryLeaderboardRepository(ENTRIES);
    const out = await getEventLeaderboard(
      "evt-1",
      { leaderboardRepo: repo },
      -10,
    );
    expect(out).toHaveLength(1);
  });

  it("defaults to DEFAULT_LEADERBOARD_LIMIT when no limit is passed", async () => {
    const many: LeaderboardEntry[] = Array.from({ length: 50 }, (_, i) =>
      makeEntry({ userId: `u${i}`, rank: i + 1, totalPoints: 1000 - i }),
    );
    const repo = new InMemoryLeaderboardRepository(many);
    const out = await getEventLeaderboard("evt-1", { leaderboardRepo: repo });
    expect(out).toHaveLength(DEFAULT_LEADERBOARD_LIMIT);
  });
});

describe("getMyEventStats", () => {
  it("returns rank + total + breakdown for a registered user", async () => {
    const breakdown: PointBreakdownItem[] = [
      { source: "sponsor", total: 50, count: 5 },
      { source: "activity", total: 40, count: 2 },
    ];
    const repo = new InMemoryLeaderboardRepository(
      ENTRIES,
      new Map([["u1", breakdown]]),
    );
    const out = await getMyEventStats("evt-1", "u1", {
      leaderboardRepo: repo,
      pointTxRepo: repo,
    });
    expect(out.rank).toBe(1);
    expect(out.totalPoints).toBe(100);
    expect(out.breakdown).toEqual(breakdown);
  });

  it("returns zero + null rank when the user isn't on the leaderboard", async () => {
    const repo = new InMemoryLeaderboardRepository(ENTRIES);
    const out = await getMyEventStats("evt-1", "unknown-user", {
      leaderboardRepo: repo,
      pointTxRepo: repo,
    });
    expect(out.rank).toBeNull();
    expect(out.totalPoints).toBe(0);
    expect(out.breakdown).toEqual([]);
  });
});
