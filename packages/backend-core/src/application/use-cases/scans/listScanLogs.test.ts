import { describe, expect, it } from "vitest";

import type { User } from "../../../domain/entities/User";
import type { ScanHistoryEntry } from "../../ports/ScanLogRepository";
import { InMemoryScanLogRepository } from "../../../test-support/InMemoryScanLogRepository";
import { InMemoryUserRepository } from "../../../test-support/InMemoryUserRepository";
import { listScanLogs, MAX_SCAN_FEED_LIMIT } from "./listScanLogs";

const EVENT = "evt-1";

function scan(overrides: Partial<ScanHistoryEntry>): ScanHistoryEntry {
  return {
    id: "sc",
    eventId: EVENT,
    scannerUserId: "u1",
    targetType: "sponsor",
    targetId: "s-1",
    result: "accepted",
    rejectReason: null,
    pointsGranted: 10,
    scannedAt: new Date("2026-07-10T10:00:00Z"),
    ...overrides,
  };
}

function user(id: string, fullName: string, email: string): User {
  return {
    id,
    googleId: null,
    email,
    fullName,
    photoUrl: null,
    company: null,
    role: null,
    phone: null,
    city: null,
    socialLinks: {},
    systemRole: "attendee",
    acceptedTermsAt: null,
    acceptedPrivacyAt: null,
    acceptedSponsorConsentAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

describe("listScanLogs", () => {
  it("returns newest-first rows with scanner identity joined", async () => {
    const scanLogRepo = new InMemoryScanLogRepository([
      scan({
        id: "a",
        scannerUserId: "u1",
        scannedAt: new Date("2026-07-10T10:00:00Z"),
      }),
      scan({
        id: "b",
        scannerUserId: "u2",
        scannedAt: new Date("2026-07-10T11:00:00Z"),
      }),
    ]);
    const userRepo = new InMemoryUserRepository([
      user("u1", "Ada", "ada@x.io"),
      user("u2", "Grace", "grace@x.io"),
    ]);

    const feed = await listScanLogs(EVENT, { scanLogRepo, userRepo });

    expect(feed.rows.map((r) => r.id)).toEqual(["b", "a"]);
    expect(feed.rows[0]).toMatchObject({
      scannerName: "Grace",
      scannerEmail: "grace@x.io",
    });
  });

  it("summarizes accepted/rejected totals and the reject-reason breakdown", async () => {
    const scanLogRepo = new InMemoryScanLogRepository([
      scan({ id: "a", result: "accepted" }),
      scan({ id: "b", result: "accepted" }),
      scan({ id: "c", result: "rejected", rejectReason: "target_inactive" }),
      scan({ id: "d", result: "rejected", rejectReason: "target_inactive" }),
      scan({ id: "e", result: "rejected", rejectReason: "already_claimed" }),
    ]);
    const feed = await listScanLogs(EVENT, {
      scanLogRepo,
      userRepo: new InMemoryUserRepository([]),
    });

    expect(feed.summary.accepted).toBe(2);
    expect(feed.summary.rejected).toBe(3);
    // Most frequent reason first — this is the misconfiguration signal.
    expect(feed.summary.rejectReasons).toEqual([
      { reason: "target_inactive", count: 2 },
      { reason: "already_claimed", count: 1 },
    ]);
  });

  it("clamps the feed limit to the max", async () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      scan({ id: `s${i}`, scannedAt: new Date(2026, 6, 10, 10, i) }),
    );
    const scanLogRepo = new InMemoryScanLogRepository(rows);
    const feed = await listScanLogs(
      EVENT,
      { scanLogRepo, userRepo: new InMemoryUserRepository([]) },
      MAX_SCAN_FEED_LIMIT + 999,
    );
    // No throw, and all 10 rows returned (fewer than the cap).
    expect(feed.rows).toHaveLength(10);
  });
});
