import { describe, expect, it } from "vitest";

import { FrozenClock } from "../../../test-support/clocks";
import { InMemoryLeaderboardRepository } from "../../../test-support/InMemoryLeaderboardRepository";
import {
  adjustEventPoints,
  MAX_ADJUSTMENT_ABS,
  PointAdjustmentInvalid,
} from "./adjustEventPoints";

function setup() {
  const pointTxRepo = new InMemoryLeaderboardRepository();
  const clock = new FrozenClock(new Date("2026-07-10T12:00:00Z"));
  return { pointTxRepo, clock };
}

const base = {
  eventId: "evt-1",
  userId: "u1",
  reason: "Helped at the check-in desk",
  actorId: "admin-1",
};

describe("adjustEventPoints", () => {
  it("posts exactly one signed admin_adjustment transaction", async () => {
    const { pointTxRepo, clock } = setup();
    const out = await adjustEventPoints(
      { ...base, points: 15 },
      { pointTxRepo, clock },
    );

    expect(out.transactionId).toBe("pt-1");
    expect(pointTxRepo.inserted).toHaveLength(1);
    expect(pointTxRepo.inserted[0]).toMatchObject({
      eventId: "evt-1",
      userId: "u1",
      sourceType: "admin_adjustment",
      sourceId: null,
      points: 15,
      note: "Helped at the check-in desk",
      actorUserId: "admin-1",
      createdAt: new Date("2026-07-10T12:00:00Z"),
    });
  });

  it("allows negative (corrective) adjustments", async () => {
    const { pointTxRepo, clock } = setup();
    await adjustEventPoints({ ...base, points: -20 }, { pointTxRepo, clock });
    expect(pointTxRepo.inserted[0]!.points).toBe(-20);
  });

  it("trims the stored reason", async () => {
    const { pointTxRepo, clock } = setup();
    await adjustEventPoints(
      { ...base, points: 5, reason: "  late bonus  " },
      { pointTxRepo, clock },
    );
    expect(pointTxRepo.inserted[0]!.note).toBe("late bonus");
  });

  it("rejects a zero adjustment", async () => {
    const { pointTxRepo, clock } = setup();
    await expect(
      adjustEventPoints({ ...base, points: 0 }, { pointTxRepo, clock }),
    ).rejects.toMatchObject({ reason: "zero" });
    expect(pointTxRepo.inserted).toHaveLength(0);
  });

  it("rejects a non-integer adjustment", async () => {
    const { pointTxRepo, clock } = setup();
    await expect(
      adjustEventPoints({ ...base, points: 2.5 }, { pointTxRepo, clock }),
    ).rejects.toMatchObject({ reason: "not_an_integer" });
  });

  it("rejects an out-of-bounds adjustment", async () => {
    const { pointTxRepo, clock } = setup();
    await expect(
      adjustEventPoints(
        { ...base, points: MAX_ADJUSTMENT_ABS + 1 },
        { pointTxRepo, clock },
      ),
    ).rejects.toBeInstanceOf(PointAdjustmentInvalid);
    expect(pointTxRepo.inserted).toHaveLength(0);
  });

  it("rejects a blank reason", async () => {
    const { pointTxRepo, clock } = setup();
    await expect(
      adjustEventPoints(
        { ...base, points: 10, reason: "   " },
        { pointTxRepo, clock },
      ),
    ).rejects.toMatchObject({ reason: "missing_reason" });
    expect(pointTxRepo.inserted).toHaveLength(0);
  });
});
