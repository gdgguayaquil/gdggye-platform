import type { Clock } from "../../ports/Clock";
import type { EventRepository } from "../../ports/EventRepository";
import type {
  ListPreCheckinFilter,
  PreCheckinSubmissionRepository,
  ReviewPreCheckinInput,
  UpsertOwnPreCheckinInput,
} from "../../ports/PreCheckinSubmissionRepository";
import type { PreCheckinStatus } from "../../../domain/entities/Registration";
import type { PreCheckinSubmission } from "../../../domain/entities/PreCheckinSubmission";

export type PreCheckinValidationReason =
  | "blank_badge_name"
  | "deadline_passed"
  | "pre_checkin_disabled"
  | "event_not_open"
  | "already_finalized";

export class PreCheckinValidationError extends Error {
  constructor(public readonly reason: PreCheckinValidationReason) {
    super(`Pre-checkin validation failed: ${reason}`);
    this.name = "PreCheckinValidationError";
  }
}

export interface PreCheckinDeps {
  preCheckinRepo: PreCheckinSubmissionRepository;
}

export interface SubmitPreCheckinDeps extends PreCheckinDeps {
  eventRepo: EventRepository;
  clock: Clock;
}

export async function getMyPreCheckin(
  eventId: string,
  userId: string,
  deps: PreCheckinDeps,
): Promise<PreCheckinSubmission | null> {
  return deps.preCheckinRepo.findForEventAndUser(eventId, userId);
}

// Attendee submit/edit. Validates:
//   1. event exists, is published or live
//   2. event has a pre_checkin_deadline set AND it's still in the future
//   3. badge_name is non-empty (trim)
//   4. if there's an existing submission, it must still be 'pending'
// The DB also enforces (1) and (2) via the self_insert policy, but
// rejecting early in the use-case gives a much cleaner error path than
// "23xxx RLS denied" surfacing from the adapter.
export async function submitPreCheckin(
  input: UpsertOwnPreCheckinInput,
  deps: SubmitPreCheckinDeps,
): Promise<PreCheckinSubmission> {
  if (input.badgeName.trim().length === 0) {
    throw new PreCheckinValidationError("blank_badge_name");
  }

  const event = await deps.eventRepo.findById(input.eventId);
  if (!event || (event.status !== "published" && event.status !== "live")) {
    throw new PreCheckinValidationError("event_not_open");
  }
  if (!event.preCheckinDeadline) {
    throw new PreCheckinValidationError("pre_checkin_disabled");
  }
  if (event.preCheckinDeadline.getTime() <= deps.clock.now().getTime()) {
    throw new PreCheckinValidationError("deadline_passed");
  }

  const existing = await deps.preCheckinRepo.findForEventAndUser(
    input.eventId,
    input.userId,
  );
  if (existing && existing.status !== "pending") {
    throw new PreCheckinValidationError("already_finalized");
  }

  return deps.preCheckinRepo.upsertOwn({
    ...input,
    badgeName: input.badgeName.trim(),
  });
}

export async function listPreCheckinForEvent(
  eventId: string,
  filter: ListPreCheckinFilter | undefined,
  deps: PreCheckinDeps,
): Promise<PreCheckinSubmission[]> {
  return deps.preCheckinRepo.listForEvent(eventId, filter);
}

// Staff path. No deadline check — staff can review at any time. The DB
// enforces is_staff() via the staff_write policy.
export async function reviewPreCheckin(
  input: ReviewPreCheckinInput,
  deps: PreCheckinDeps,
): Promise<PreCheckinSubmission> {
  return deps.preCheckinRepo.reviewByStaff(input);
}

export type { PreCheckinStatus };
