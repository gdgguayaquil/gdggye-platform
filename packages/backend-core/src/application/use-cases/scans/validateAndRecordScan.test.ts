import { describe, expect, it } from "vitest";

import { ScanRejected } from "../../../domain/errors/ScanRejected";
import type { ScanTarget } from "../../../domain/rules/scoringRules";
import { SPONSOR_SCAN_POINTS } from "../../../domain/rules/scoringRules";
import type { Event } from "../../../domain/entities/Event";
import { FrozenClock } from "../../../test-support/clocks";
import { makeEvent } from "../../../test-support/fixtures";
import { InMemoryEventRepository } from "../../../test-support/InMemoryEventRepository";
import { InMemoryScanRepository } from "../../../test-support/InMemoryScanRepository";
import { InMemoryScanTargetRepository } from "../../../test-support/InMemoryScanTargetRepository";
import { validateAndRecordScan } from "./validateAndRecordScan";

// Common test scaffolding: a live event during hours, a valid sponsor
// target attached to it, and a scanner user who isn't the target.
function scaffold(
  overrides: {
    eventOverrides?: Partial<Event>;
    targets?: ScanTarget[];
    now?: Date;
  } = {},
) {
  const event = makeEvent({
    id: "evt-1",
    status: "live",
    startAt: new Date("2026-05-23T09:00:00-05:00"),
    endAt: new Date("2026-05-23T19:00:00-05:00"),
    ...overrides.eventOverrides,
  });
  const now = overrides.now ?? new Date("2026-05-23T12:00:00-05:00");
  const events = new InMemoryEventRepository([event]);
  const targets = new InMemoryScanTargetRepository(
    overrides.targets ?? [
      { type: "sponsor", id: "spo-1", eventId: "evt-1", isActive: true },
    ],
  );
  const scans = new InMemoryScanRepository();
  const clock = new FrozenClock(now);
  return { event, events, targets, scans, clock };
}

const HAPPY_INPUT = {
  eventId: "evt-1",
  scannerUserId: "user-a",
  targetType: "sponsor" as const,
  targetId: "spo-1",
};

describe("validateAndRecordScan", () => {
  it("accepts a valid sponsor scan and returns the granted points", async () => {
    const { events, targets, scans, clock } = scaffold();
    const out = await validateAndRecordScan(HAPPY_INPUT, {
      events,
      targets,
      scans,
      clock,
    });
    expect(out.pointsGranted).toBe(SPONSOR_SCAN_POINTS);
    expect(out.newTotal).toBe(SPONSOR_SCAN_POINTS);
    expect(scans.accepted).toHaveLength(1);
    expect(scans.rejected).toHaveLength(0);
  });

  it("rejects when the event does not exist", async () => {
    const { targets, scans, clock } = scaffold();
    const events = new InMemoryEventRepository([]);
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "wrong_event" });
    expect(scans.rejected).toHaveLength(1);
    expect(scans.rejected[0]?.reason).toBe("wrong_event");
  });

  it("rejects when the event is not live", async () => {
    const { events, targets, scans, clock } = scaffold({
      eventOverrides: { status: "published" },
    });
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "event_not_live" });
    expect(scans.rejected[0]?.reason).toBe("event_not_live");
  });

  it("rejects when now is outside event hours", async () => {
    const { events, targets, scans, clock } = scaffold({
      now: new Date("2026-05-23T22:00:00-05:00"),
    });
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "outside_event_hours" });
  });

  it("rejects when the target is unknown", async () => {
    const { events, scans, clock } = scaffold();
    const targets = new InMemoryScanTargetRepository([]);
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "target_inactive" });
  });

  it("rejects when the target is inactive", async () => {
    const { events, scans, clock } = scaffold();
    const targets = new InMemoryScanTargetRepository([
      { type: "sponsor", id: "spo-1", eventId: "evt-1", isActive: false },
    ]);
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "target_inactive" });
  });

  it("rejects when the target is attached to a different event", async () => {
    const { events, scans, clock } = scaffold();
    const targets = new InMemoryScanTargetRepository([
      { type: "sponsor", id: "spo-1", eventId: "evt-other", isActive: true },
    ]);
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "target_inactive" });
  });

  it("rejects self-scan on attendee target", async () => {
    const { events, scans, clock } = scaffold({
      targets: [
        { type: "attendee", id: "user-a", eventId: "evt-1", isActive: true },
      ],
    });
    const targets = new InMemoryScanTargetRepository([
      { type: "attendee", id: "user-a", eventId: "evt-1", isActive: true },
    ]);
    await expect(
      validateAndRecordScan(
        {
          eventId: "evt-1",
          scannerUserId: "user-a",
          targetType: "attendee",
          targetId: "user-a",
        },
        { events, targets, scans, clock },
      ),
    ).rejects.toMatchObject({ reason: "self_scan" });
  });

  it("rejects when now is before an activity's start window", async () => {
    const { events, scans, clock } = scaffold({
      now: new Date("2026-05-23T09:30:00-05:00"),
    });
    const targets = new InMemoryScanTargetRepository([
      {
        type: "activity",
        id: "act-1",
        eventId: "evt-1",
        isActive: true,
        points: 20,
        startsAt: new Date("2026-05-23T10:00:00-05:00"),
        endsAt: new Date("2026-05-23T11:00:00-05:00"),
      },
    ]);
    await expect(
      validateAndRecordScan(
        {
          eventId: "evt-1",
          scannerUserId: "user-a",
          targetType: "activity",
          targetId: "act-1",
        },
        { events, targets, scans, clock },
      ),
    ).rejects.toMatchObject({ reason: "outside_activity_window" });
  });

  it("rejects when now is after an activity's end window", async () => {
    const { events, scans, clock } = scaffold({
      now: new Date("2026-05-23T11:30:00-05:00"),
    });
    const targets = new InMemoryScanTargetRepository([
      {
        type: "activity",
        id: "act-1",
        eventId: "evt-1",
        isActive: true,
        points: 20,
        startsAt: new Date("2026-05-23T10:00:00-05:00"),
        endsAt: new Date("2026-05-23T11:00:00-05:00"),
      },
    ]);
    await expect(
      validateAndRecordScan(
        {
          eventId: "evt-1",
          scannerUserId: "user-a",
          targetType: "activity",
          targetId: "act-1",
        },
        { events, targets, scans, clock },
      ),
    ).rejects.toMatchObject({ reason: "outside_activity_window" });
  });

  it("rejects a duplicate scan the second time (already_claimed)", async () => {
    const { events, targets, scans, clock } = scaffold();
    await validateAndRecordScan(HAPPY_INPUT, {
      events,
      targets,
      scans,
      clock,
    });
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "already_claimed" });
    expect(scans.accepted).toHaveLength(1);
  });

  it("maps a 23505 race on accept to already_claimed and logs it", async () => {
    const { events, targets, scans, clock } = scaffold();
    scans.raceOnNextAccept = true;
    await expect(
      validateAndRecordScan(HAPPY_INPUT, { events, targets, scans, clock }),
    ).rejects.toMatchObject({ reason: "already_claimed" });
    expect(scans.rejected.at(-1)?.reason).toBe("already_claimed");
  });

  it("swallows failures from the rejection log so the original reason surfaces", async () => {
    const { events, targets, scans, clock } = scaffold({
      eventOverrides: { status: "closed" },
    });
    scans.failOnReject = true;
    // The reject log fails; we still want the ScanRejected("event_not_live")
    // to reach the caller instead of the log-write error masking it.
    const err = await validateAndRecordScan(HAPPY_INPUT, {
      events,
      targets,
      scans,
      clock,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(ScanRejected);
    expect(err.reason).toBe("event_not_live");
  });

  it("accumulates newTotal across multiple accepted scans", async () => {
    const { events, targets, scans, clock } = scaffold({
      targets: [
        { type: "sponsor", id: "spo-1", eventId: "evt-1", isActive: true },
        { type: "sponsor", id: "spo-2", eventId: "evt-1", isActive: true },
      ],
    });
    const first = await validateAndRecordScan(HAPPY_INPUT, {
      events,
      targets,
      scans,
      clock,
    });
    const second = await validateAndRecordScan(
      { ...HAPPY_INPUT, targetId: "spo-2" },
      { events, targets, scans, clock },
    );
    expect(first.newTotal).toBe(SPONSOR_SCAN_POINTS);
    expect(second.newTotal).toBe(SPONSOR_SCAN_POINTS * 2);
  });
});
