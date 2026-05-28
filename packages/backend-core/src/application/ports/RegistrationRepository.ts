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

  // Idempotent — relies on the (event_id, user_id) unique constraint. If a
  // registration already exists, return it untouched.
  ensure(input: EnsureRegistrationInput): Promise<Registration>;
}
