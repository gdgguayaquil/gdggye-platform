import { describe, expect, it } from "vitest";

import type { Registration } from "../../../domain/entities/Registration";
import type { ScanHistoryEntry } from "../../ports/ScanLogRepository";
import { InMemoryRegistrationRepository } from "../../../test-support/InMemoryRegistrationRepository";
import { InMemoryScanLogRepository } from "../../../test-support/InMemoryScanLogRepository";
import { getEventOverview } from "./getEventOverview";

const EVENT = "evt-1";

function reg(
  userId: string,
  status: Registration["preCheckinStatus"],
  totalPoints: number,
): Registration {
  return {
    id: `reg-${userId}`,
    eventId: EVENT,
    userId,
    preCheckinStatus: status,
    approvedAt: null,
    totalPoints,
    eventRank: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
}

function scan(result: ScanHistoryEntry["result"]): ScanHistoryEntry {
  return {
    id: `sc-${Math.random()}`,
    eventId: EVENT,
    scannerUserId: "u1",
    targetType: "sponsor",
    targetId: "t-1",
    result,
    rejectReason: result === "rejected" ? "target_inactive" : null,
    pointsGranted: result === "accepted" ? 10 : 0,
    scannedAt: new Date("2026-07-10T10:00:00Z"),
  };
}

describe("getEventOverview", () => {
  it("aggregates registrations, pre-checkin, points, and scans", async () => {
    const registrationRepo = new InMemoryRegistrationRepository([
      reg("u1", "approved", 30),
      reg("u2", "approved", 20),
      reg("u3", "pending", 0),
      reg("u4", "not_submitted", 5),
    ]);
    const scanLogRepo = new InMemoryScanLogRepository([
      scan("accepted"),
      scan("accepted"),
      scan("rejected"),
    ]);

    const overview = await getEventOverview(EVENT, {
      registrationRepo,
      scanLogRepo,
    });

    expect(overview.registrations).toBe(4);
    expect(overview.preCheckin).toEqual({
      approved: 2,
      pending: 1,
      rejected: 0,
      notSubmitted: 1,
    });
    expect(overview.pointsGranted).toBe(55);
    expect(overview.scansAccepted).toBe(2);
    expect(overview.scansRejected).toBe(1);
  });

  it("returns zeroes for an event with no activity", async () => {
    const overview = await getEventOverview(EVENT, {
      registrationRepo: new InMemoryRegistrationRepository([]),
      scanLogRepo: new InMemoryScanLogRepository([]),
    });
    expect(overview).toEqual({
      registrations: 0,
      preCheckin: { approved: 0, pending: 0, rejected: 0, notSubmitted: 0 },
      pointsGranted: 0,
      scansAccepted: 0,
      scansRejected: 0,
    });
  });
});
