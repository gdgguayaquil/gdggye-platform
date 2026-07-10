import type { Registration } from "../../domain/entities/Registration";

export interface EnsureRegistrationInput {
  eventId: string;
  userId: string;
}

export interface RegistrationRepository {
  findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<Registration | null>;

  // Every registration for one event. Admin read (staff-scoped client);
  // ordering is left to the use-case. Cardinality is one event's attendees.
  listByEvent(eventId: string): Promise<Registration[]>;

  // Idempotent — relies on the (event_id, user_id) unique constraint. If a
  // registration already exists, return it untouched.
  ensure(input: EnsureRegistrationInput): Promise<Registration>;
}
