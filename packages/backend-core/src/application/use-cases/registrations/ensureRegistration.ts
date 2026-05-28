import type { Registration } from "../../../domain/entities/Registration";
import { canParticipateInEvents } from "../../../domain/entities/User";
import type { EventRepository } from "../../ports/EventRepository";
import type { RegistrationRepository } from "../../ports/RegistrationRepository";
import type { UserRepository } from "../../ports/UserRepository";

export class RegistrationBlocked extends Error {
  constructor(public readonly reason: RegistrationBlockedReason) {
    super(`Registration blocked: ${reason}`);
    this.name = "RegistrationBlocked";
  }
}

export type RegistrationBlockedReason =
  | "user_not_found"
  | "event_not_found"
  | "event_not_open"
  | "profile_incomplete";

export interface EnsureRegistrationRequest {
  eventId: string;
  userId: string;
}

export interface EnsureRegistrationDeps {
  userRepo: UserRepository;
  eventRepo: EventRepository;
  registrationRepo: RegistrationRepository;
}

// Epic D1 — idempotent. Registering is gated on:
//   1. user exists,
//   2. event exists and is published/live (not draft, not closed),
//   3. profile is complete + required consents recorded.
// The DB unique constraint (event_id, user_id) is the final guard.
export async function ensureRegistration(
  input: EnsureRegistrationRequest,
  deps: EnsureRegistrationDeps,
): Promise<Registration> {
  const user = await deps.userRepo.findById(input.userId);
  if (!user) throw new RegistrationBlocked("user_not_found");

  if (!canParticipateInEvents(user)) {
    throw new RegistrationBlocked("profile_incomplete");
  }

  const event = await deps.eventRepo.findById(input.eventId);
  if (!event) throw new RegistrationBlocked("event_not_found");
  if (event.status !== "published" && event.status !== "live") {
    throw new RegistrationBlocked("event_not_open");
  }

  return deps.registrationRepo.ensure({
    eventId: event.id,
    userId: input.userId,
  });
}
