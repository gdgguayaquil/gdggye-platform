import type { Database } from "@gdggye/types";
import type {
  ListPreCheckinFilter,
  PreCheckinSubmission,
  PreCheckinSubmissionRepository,
  ReviewPreCheckinInput,
  UpsertOwnPreCheckinInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

type Row = Database["public"]["Tables"]["pre_checkin_submissions"]["Row"];

function rowToSubmission(row: Row): PreCheckinSubmission {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    badgeName: row.badge_name,
    photoConsent: row.photo_consent,
    dietary: row.dietary,
    tshirtSize: row.tshirt_size,
    notes: row.notes,
    reviewerUserId: row.reviewer_user_id,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    reviewNotes: row.review_notes,
    submittedAt: new Date(row.submitted_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabasePreCheckinSubmissionRepository implements PreCheckinSubmissionRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findForEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<PreCheckinSubmission | null> {
    const { data, error } = await this.client
      .from("pre_checkin_submissions")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabasePreCheckinSubmissionRepository.findForEventAndUser: ${error.message}`,
      );
    return data ? rowToSubmission(data) : null;
  }

  async listForEvent(
    eventId: string,
    filter?: ListPreCheckinFilter,
  ): Promise<PreCheckinSubmission[]> {
    let q = this.client
      .from("pre_checkin_submissions")
      .select("*")
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: false });
    if (filter?.status) q = q.eq("status", filter.status);
    const { data, error } = await q;
    if (error)
      throw new Error(
        `SupabasePreCheckinSubmissionRepository.listForEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToSubmission);
  }

  // Race-safe via the (event_id, user_id) unique index. First try INSERT;
  // if 23505 fires (someone else's request already inserted), find +
  // UPDATE the existing row. Same pattern as event_sponsors.attach.
  async upsertOwn(
    input: UpsertOwnPreCheckinInput,
  ): Promise<PreCheckinSubmission> {
    const payload = {
      event_id: input.eventId,
      user_id: input.userId,
      badge_name: input.badgeName,
      photo_consent: input.photoConsent,
      dietary: input.dietary ?? null,
      tshirt_size: input.tshirtSize ?? null,
      notes: input.notes ?? null,
    };

    const { data: inserted, error: insertError } = await this.client
      .from("pre_checkin_submissions")
      .insert(payload)
      .select("*")
      .single();
    if (!insertError && inserted) return rowToSubmission(inserted);

    if (insertError && insertError.code === "23505") {
      const existing = await this.findForEventAndUser(
        input.eventId,
        input.userId,
      );
      if (!existing) {
        throw new Error(
          `SupabasePreCheckinSubmissionRepository.upsertOwn: 23505 but no existing row visible`,
        );
      }
      const { data: updated, error: updateError } = await this.client
        .from("pre_checkin_submissions")
        .update({
          badge_name: input.badgeName,
          photo_consent: input.photoConsent,
          dietary: input.dietary ?? null,
          tshirt_size: input.tshirtSize ?? null,
          notes: input.notes ?? null,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updateError)
        throw new Error(
          `SupabasePreCheckinSubmissionRepository.upsertOwn (update): ${updateError.message}`,
        );
      return rowToSubmission(updated);
    }

    throw new Error(
      `SupabasePreCheckinSubmissionRepository.upsertOwn: ${insertError?.message ?? "unknown"}`,
    );
  }

  async reviewByStaff(
    input: ReviewPreCheckinInput,
  ): Promise<PreCheckinSubmission> {
    const { data, error } = await this.client
      .from("pre_checkin_submissions")
      .update({
        status: input.status,
        reviewer_user_id: input.reviewerUserId,
        reviewed_at: new Date().toISOString(),
        review_notes: input.reviewNotes ?? null,
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error)
      throw new Error(
        `SupabasePreCheckinSubmissionRepository.reviewByStaff: ${error.message}`,
      );
    return rowToSubmission(data);
  }
}
