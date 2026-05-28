import type {
  BootstrapUserInput,
  ProfileUpdate,
  User,
  UserRepository,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";
import { rowToUser } from "./mappersPhase2";

// signInBootstrap is the one write that runs before there's any users row,
// so it lives on the service client (no insert policy exists for attendees
// on `users` — see migration 0004 commentary). The rest of the writes hit
// the user-scoped client and satisfy the `id = auth.uid()` update policy.
export class SupabaseUserRepository implements UserRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      throw new Error(`SupabaseUserRepository.findById: ${error.message}`);
    return data ? rowToUser(data) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("google_id", googleId)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseUserRepository.findByGoogleId: ${error.message}`,
      );
    return data ? rowToUser(data) : null;
  }

  async upsertBootstrap(input: BootstrapUserInput): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .upsert(
        {
          id: input.id,
          email: input.email,
          google_id: input.googleId ?? null,
          full_name: input.fullName ?? "",
          photo_url: input.photoUrl ?? null,
        },
        { onConflict: "id", ignoreDuplicates: false },
      )
      .select("*")
      .single();
    if (error)
      throw new Error(
        `SupabaseUserRepository.upsertBootstrap: ${error.message}`,
      );
    return rowToUser(data);
  }

  async updateProfile(userId: string, patch: ProfileUpdate): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .update({
        full_name: patch.fullName,
        photo_url: patch.photoUrl,
        company: patch.company,
        role: patch.role,
        phone: patch.phone,
        city: patch.city,
        social_links: patch.socialLinks,
      })
      .eq("id", userId)
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseUserRepository.updateProfile: ${error.message}`);
    return rowToUser(data);
  }

  async setConsentTimestamp(
    userId: string,
    consentType: "terms" | "privacy" | "sponsor",
    at: Date,
  ): Promise<User> {
    const iso = at.toISOString();
    const patch =
      consentType === "terms"
        ? { accepted_terms_at: iso }
        : consentType === "privacy"
          ? { accepted_privacy_at: iso }
          : { accepted_sponsor_consent_at: iso };
    const { data, error } = await this.client
      .from("users")
      .update(patch)
      .eq("id", userId)
      .select("*")
      .single();
    if (error)
      throw new Error(
        `SupabaseUserRepository.setConsentTimestamp: ${error.message}`,
      );
    return rowToUser(data);
  }
}
