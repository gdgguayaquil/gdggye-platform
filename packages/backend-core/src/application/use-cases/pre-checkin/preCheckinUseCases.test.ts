import { describe, expect, it } from "vitest";

import type { PreCheckinSubmission } from "../../../domain/entities/PreCheckinSubmission";
import { FrozenClock } from "../../../test-support/clocks";
import { makeEvent } from "../../../test-support/fixtures";
import { InMemoryEventRepository } from "../../../test-support/InMemoryEventRepository";
import { InMemoryPreCheckinSubmissionRepository } from "../../../test-support/InMemoryPreCheckinSubmissionRepository";
import {
  getMyPreCheckin,
  listPreCheckinForEvent,
  PreCheckinValidationError,
  reviewPreCheckin,
  submitPreCheckin,
} from "./preCheckinUseCases";

const NOW = new Date("2026-05-01T12:00:00-05:00");
const FUTURE = new Date("2026-05-20T23:59:00-05:00");
const PAST = new Date("2026-04-01T00:00:00-05:00");

function scaffold(
  eventOverrides: Parameters<typeof makeEvent>[0] = {},
  seedSubmissions: PreCheckinSubmission[] = [],
) {
  const event = makeEvent({
    id: "evt-1",
    status: "published",
    preCheckinDeadline: FUTURE,
    ...eventOverrides,
  });
  const eventRepo = new InMemoryEventRepository([event]);
  const preCheckinRepo = new InMemoryPreCheckinSubmissionRepository(
    seedSubmissions,
  );
  preCheckinRepo.now = () => NOW;
  const clock = new FrozenClock(NOW);
  return { event, eventRepo, preCheckinRepo, clock };
}

const HAPPY_INPUT = {
  eventId: "evt-1",
  userId: "user-a",
  badgeName: "Ada Lovelace",
  photoConsent: true,
  dietary: "vegetarian",
  tshirtSize: "M",
  notes: null,
};

describe("submitPreCheckin", () => {
  it("creates a pending submission on the happy path", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold();
    const created = await submitPreCheckin(HAPPY_INPUT, {
      eventRepo,
      preCheckinRepo,
      clock,
    });
    expect(created.status).toBe("pending");
    expect(created.badgeName).toBe("Ada Lovelace");
    expect(preCheckinRepo.rows).toHaveLength(1);
  });

  it("trims the badge name on save", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold();
    const created = await submitPreCheckin(
      { ...HAPPY_INPUT, badgeName: "  Ada  " },
      { eventRepo, preCheckinRepo, clock },
    );
    expect(created.badgeName).toBe("Ada");
  });

  it("rejects blank badge name (whitespace only)", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold();
    await expect(
      submitPreCheckin(
        { ...HAPPY_INPUT, badgeName: "   " },
        { eventRepo, preCheckinRepo, clock },
      ),
    ).rejects.toBeInstanceOf(PreCheckinValidationError);
  });

  it("rejects when the event has no pre_checkin_deadline (feature disabled)", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({
      preCheckinDeadline: null,
    });
    await expect(
      submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock }),
    ).rejects.toMatchObject({ reason: "pre_checkin_disabled" });
  });

  it("rejects when the deadline has passed", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({
      preCheckinDeadline: PAST,
    });
    await expect(
      submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock }),
    ).rejects.toMatchObject({ reason: "deadline_passed" });
  });

  it("rejects when the event is draft", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({ status: "draft" });
    await expect(
      submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock }),
    ).rejects.toMatchObject({ reason: "event_not_open" });
  });

  it("rejects when the event is closed", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({ status: "closed" });
    await expect(
      submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock }),
    ).rejects.toMatchObject({ reason: "event_not_open" });
  });

  it("rejects when the event does not exist", async () => {
    const { preCheckinRepo, clock } = scaffold();
    const eventRepo = new InMemoryEventRepository([]);
    await expect(
      submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock }),
    ).rejects.toMatchObject({ reason: "event_not_open" });
  });

  it("accepts live events", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({ status: "live" });
    const created = await submitPreCheckin(HAPPY_INPUT, {
      eventRepo,
      preCheckinRepo,
      clock,
    });
    expect(created.status).toBe("pending");
  });

  it("allows editing an existing pending submission", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({}, [
      {
        id: "pc-existing",
        eventId: "evt-1",
        userId: "user-a",
        status: "pending",
        badgeName: "old name",
        photoConsent: false,
        dietary: null,
        tshirtSize: null,
        notes: null,
        reviewerUserId: null,
        reviewedAt: null,
        reviewNotes: null,
        submittedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
    const updated = await submitPreCheckin(
      { ...HAPPY_INPUT, badgeName: "new name" },
      { eventRepo, preCheckinRepo, clock },
    );
    expect(updated.id).toBe("pc-existing");
    expect(updated.badgeName).toBe("new name");
    expect(preCheckinRepo.rows).toHaveLength(1);
  });

  it("rejects re-submission after approval (already_finalized)", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({}, [
      {
        id: "pc-approved",
        eventId: "evt-1",
        userId: "user-a",
        status: "approved",
        badgeName: "Ada",
        photoConsent: true,
        dietary: null,
        tshirtSize: null,
        notes: null,
        reviewerUserId: "staff-1",
        reviewedAt: NOW,
        reviewNotes: null,
        submittedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
    await expect(
      submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock }),
    ).rejects.toMatchObject({ reason: "already_finalized" });
  });

  it("rejects re-submission after rejection (already_finalized)", async () => {
    const { eventRepo, preCheckinRepo, clock } = scaffold({}, [
      {
        id: "pc-rejected",
        eventId: "evt-1",
        userId: "user-a",
        status: "rejected",
        badgeName: "Ada",
        photoConsent: true,
        dietary: null,
        tshirtSize: null,
        notes: null,
        reviewerUserId: "staff-1",
        reviewedAt: NOW,
        reviewNotes: "bad photo",
        submittedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
    await expect(
      submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock }),
    ).rejects.toMatchObject({ reason: "already_finalized" });
  });
});

describe("getMyPreCheckin", () => {
  it("returns null when no submission exists", async () => {
    const { preCheckinRepo } = scaffold();
    const found = await getMyPreCheckin("evt-1", "user-a", { preCheckinRepo });
    expect(found).toBeNull();
  });

  it("returns the caller's submission", async () => {
    const { preCheckinRepo, eventRepo, clock } = scaffold();
    await submitPreCheckin(HAPPY_INPUT, { eventRepo, preCheckinRepo, clock });
    const found = await getMyPreCheckin("evt-1", "user-a", { preCheckinRepo });
    expect(found?.badgeName).toBe("Ada Lovelace");
  });
});

describe("listPreCheckinForEvent", () => {
  it("filters by status", async () => {
    const { preCheckinRepo } = scaffold({}, [
      makeSubmission({ id: "p1", userId: "u1", status: "pending" }),
      makeSubmission({ id: "p2", userId: "u2", status: "approved" }),
    ]);
    const pending = await listPreCheckinForEvent(
      "evt-1",
      { status: "pending" },
      { preCheckinRepo },
    );
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe("p1");
  });

  it("returns all rows when no filter is passed", async () => {
    const { preCheckinRepo } = scaffold({}, [
      makeSubmission({ id: "p1", userId: "u1", status: "pending" }),
      makeSubmission({ id: "p2", userId: "u2", status: "approved" }),
    ]);
    const all = await listPreCheckinForEvent("evt-1", undefined, {
      preCheckinRepo,
    });
    expect(all).toHaveLength(2);
  });
});

function makeSubmission(
  overrides: Partial<PreCheckinSubmission> = {},
): PreCheckinSubmission {
  return {
    id: "pc-x",
    eventId: "evt-1",
    userId: "user-a",
    status: "pending",
    badgeName: "Ada",
    photoConsent: true,
    dietary: null,
    tshirtSize: null,
    notes: null,
    reviewerUserId: null,
    reviewedAt: null,
    reviewNotes: null,
    submittedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("reviewPreCheckin", () => {
  it("approves a pending submission and records reviewer + timestamp", async () => {
    const { preCheckinRepo } = scaffold({}, [
      makeSubmission({ id: "p1", userId: "user-a", status: "pending" }),
    ]);
    const out = await reviewPreCheckin(
      { id: "p1", reviewerUserId: "staff-1", status: "approved" },
      { preCheckinRepo },
    );
    expect(out.status).toBe("approved");
    expect(out.reviewerUserId).toBe("staff-1");
    expect(out.reviewedAt).not.toBeNull();
  });

  it("rejects a pending submission with review notes", async () => {
    const { preCheckinRepo } = scaffold({}, [
      makeSubmission({ id: "p1", userId: "user-a", status: "pending" }),
    ]);
    const out = await reviewPreCheckin(
      {
        id: "p1",
        reviewerUserId: "staff-1",
        status: "rejected",
        reviewNotes: "photo unclear",
      },
      { preCheckinRepo },
    );
    expect(out.status).toBe("rejected");
    expect(out.reviewNotes).toBe("photo unclear");
  });

  it("refuses to double-review a finalized submission", async () => {
    const { preCheckinRepo } = scaffold({}, [
      makeSubmission({ id: "p1", userId: "user-a", status: "approved" }),
    ]);
    await expect(
      reviewPreCheckin(
        { id: "p1", reviewerUserId: "staff-1", status: "rejected" },
        { preCheckinRepo },
      ),
    ).rejects.toThrow(/not pending/);
  });
});
