import type {
  ConsentRecord,
  ConsentRepository,
  RecordConsentInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";
import { rowToConsentRecord } from "./mappersPhase2";

export class SupabaseConsentRepository implements ConsentRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async record(input: RecordConsentInput): Promise<ConsentRecord> {
    const { data, error } = await this.client
      .from("consent_records")
      .insert({
        user_id: input.userId,
        consent_type: input.consentType,
        version: input.version,
        accepted_at: input.acceptedAt.toISOString(),
      })
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseConsentRepository.record: ${error.message}`);
    return rowToConsentRecord(data);
  }

  async listForUser(userId: string): Promise<ConsentRecord[]> {
    const { data, error } = await this.client
      .from("consent_records")
      .select("*")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false });
    if (error)
      throw new Error(
        `SupabaseConsentRepository.listForUser: ${error.message}`,
      );
    return (data ?? []).map(rowToConsentRecord);
  }
}
