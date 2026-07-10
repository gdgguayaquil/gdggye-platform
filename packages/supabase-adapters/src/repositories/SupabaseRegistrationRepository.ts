import type {
  EnsureRegistrationInput,
  Registration,
  RegistrationRepository,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { AnySupabaseClient } from "../client/types";
import { rowToRegistration } from "./mappersPhase2";

export class SupabaseRegistrationRepository implements RegistrationRepository {
  private readonly client: AnySupabaseClient;
  constructor(client: SupabaseServerClient | SupabaseServiceClient) {
    this.client = client as AnySupabaseClient;
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<Registration | null> {
    const { data, error } = await this.client
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseRegistrationRepository.findByEventAndUser: ${error.message}`,
      );
    return data ? rowToRegistration(data) : null;
  }

  async listByEvent(eventId: string): Promise<Registration[]> {
    const { data, error } = await this.client
      .from("registrations")
      .select("*")
      .eq("event_id", eventId);
    if (error)
      throw new Error(
        `SupabaseRegistrationRepository.listByEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToRegistration);
  }

  async ensure(input: EnsureRegistrationInput): Promise<Registration> {
    // Idempotent. Race-safe via the (event_id, user_id) unique constraint:
    // a duplicate insert errors with code 23505, which we treat as success
    // and re-fetch the row.
    const { data, error } = await this.client
      .from("registrations")
      .insert({ event_id: input.eventId, user_id: input.userId })
      .select("*")
      .single();

    if (!error && data) return rowToRegistration(data);

    if (error && error.code === "23505") {
      const existing = await this.findByEventAndUser(
        input.eventId,
        input.userId,
      );
      if (existing) return existing;
    }
    throw new Error(
      `SupabaseRegistrationRepository.ensure: ${error?.message ?? "unknown"}`,
    );
  }
}
