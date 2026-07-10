import { describe, expect, it } from "vitest";

import type { PointLedgerEntry } from "../../../domain/entities/Leaderboard";
import type { Registration } from "../../../domain/entities/Registration";
import type { User } from "../../../domain/entities/User";
import type { ScanHistoryEntry } from "../../ports/ScanLogRepository";
import { InMemoryLeaderboardRepository } from "../../../test-support/InMemoryLeaderboardRepository";
import { InMemoryRegistrationRepository } from "../../../test-support/InMemoryRegistrationRepository";
import { InMemoryScanLogRepository } from "../../../test-support/InMemoryScanLogRepository";
import { InMemoryUserRepository } from "../../../test-support/InMemoryUserRepository";
import { getRegistrationDetail } from "./getRegistrationDetail";
import { listEventRegistrations } from "./listEventRegistrations";

const EVENT = "evt-1";

function reg(
  overrides: Partial<Registration> & { userId: string },
): Registration {
  return {
    id: `reg-${overrides.userId}`,
    eventId: EVENT,
    preCheckinStatus: "not_submitted",
    approvedAt: null,
    totalPoints: 0,
    eventRank: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
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

describe("listEventRegistrations", () => {
  it("orders by points desc and joins identity", async () => {
    const registrationRepo = new InMemoryRegistrationRepository([
      reg({ userId: "u1", totalPoints: 30 }),
      reg({ userId: "u2", totalPoints: 80 }),
      reg({ userId: "u3", totalPoints: 50 }),
    ]);
    const userRepo = new InMemoryUserRepository([
      user("u1", "Ada", "ada@x.io"),
      user("u2", "Grace", "grace@x.io"),
      user("u3", "Linus", "linus@x.io"),
    ]);

    const rows = await listEventRegistrations(EVENT, {
      registrationRepo,
      userRepo,
    });

    expect(rows.map((r) => r.userId)).toEqual(["u2", "u3", "u1"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rows[0]).toMatchObject({ fullName: "Grace", email: "grace@x.io" });
  });

  it("gives tied points the same rank and skips the next (competition ranking)", async () => {
    const registrationRepo = new InMemoryRegistrationRepository([
      reg({
        userId: "u1",
        totalPoints: 50,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      }),
      reg({
        userId: "u2",
        totalPoints: 50,
        createdAt: new Date("2026-01-02T00:00:00Z"),
      }),
      reg({ userId: "u3", totalPoints: 10 }),
    ]);
    const userRepo = new InMemoryUserRepository([
      user("u1", "A", "a@x.io"),
      user("u2", "B", "b@x.io"),
      user("u3", "C", "c@x.io"),
    ]);

    const rows = await listEventRegistrations(EVENT, {
      registrationRepo,
      userRepo,
    });

    // Earlier registration breaks the tie for ordering; both share rank 1;
    // the third attendee is rank 3, not 2.
    expect(rows.map((r) => r.userId)).toEqual(["u1", "u2", "u3"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("tolerates a missing user row (identity blank, not a throw)", async () => {
    const registrationRepo = new InMemoryRegistrationRepository([
      reg({ userId: "ghost", totalPoints: 5 }),
    ]);
    const rows = await listEventRegistrations(EVENT, {
      registrationRepo,
      userRepo: new InMemoryUserRepository([]),
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: "ghost", fullName: "", email: "" });
  });

  it("returns empty for an event with no registrations", async () => {
    const rows = await listEventRegistrations(EVENT, {
      registrationRepo: new InMemoryRegistrationRepository([]),
      userRepo: new InMemoryUserRepository([]),
    });
    expect(rows).toEqual([]);
  });
});

describe("getRegistrationDetail", () => {
  const ledger: PointLedgerEntry[] = [
    {
      id: "pt-1",
      eventId: EVENT,
      userId: "u1",
      source: "sponsor",
      sourceId: "s-1",
      points: 10,
      note: null,
      createdAt: new Date("2026-01-01T10:00:00Z"),
    },
    {
      id: "pt-2",
      eventId: EVENT,
      userId: "u1",
      source: "activity",
      sourceId: "a-1",
      points: 25,
      note: null,
      createdAt: new Date("2026-01-01T11:00:00Z"),
    },
  ];
  const scans: ScanHistoryEntry[] = [
    {
      id: "sc-1",
      eventId: EVENT,
      scannerUserId: "u1",
      targetType: "sponsor",
      targetId: "s-1",
      result: "accepted",
      rejectReason: null,
      pointsGranted: 10,
      scannedAt: new Date("2026-01-01T10:00:00Z"),
    },
  ];

  function deps(totalPoints: number) {
    const lb = new InMemoryLeaderboardRepository(
      [],
      new Map(),
      new Map([["u1", ledger]]),
    );
    return {
      registrationRepo: new InMemoryRegistrationRepository([
        reg({ userId: "u1", totalPoints }),
      ]),
      userRepo: new InMemoryUserRepository([user("u1", "Ada", "ada@x.io")]),
      pointTxRepo: lb,
      scanLogRepo: new InMemoryScanLogRepository(scans),
    };
  }

  it("returns null when the user isn't registered", async () => {
    const detail = await getRegistrationDetail(EVENT, "nobody", deps(0));
    expect(detail).toBeNull();
  });

  it("assembles ledger + scans and reconciles a correct total", async () => {
    const detail = await getRegistrationDetail(EVENT, "u1", deps(35));
    expect(detail).not.toBeNull();
    expect(detail!.ledger).toHaveLength(2);
    expect(detail!.scans).toHaveLength(1);
    expect(detail!.ledgerSum).toBe(35);
    expect(detail!.reconciled).toBe(true);
    expect(detail!.user.fullName).toBe("Ada");
  });

  it("flags a drift when the total doesn't match the ledger sum", async () => {
    const detail = await getRegistrationDetail(EVENT, "u1", deps(999));
    expect(detail!.ledgerSum).toBe(35);
    expect(detail!.reconciled).toBe(false);
  });
});
