import type { PreCheckinStatus } from "../../domain/entities/Registration";
import type {
  PreCheckinSubmission,
  SubmittedPreCheckinStatus,
} from "../../domain/entities/PreCheckinSubmission";

// What the attendee provides on submit or edit. status is implicitly
// 'pending' — only staff can change it via reviewByStaff.
export interface UpsertOwnPreCheckinInput {
  eventId: string;
  userId: string;
  badgeName: string;
  photoConsent: boolean;
  dietary?: string | null;
  tshirtSize?: string | null;
  notes?: string | null;
}

export interface ReviewPreCheckinInput {
  id: string;
  reviewerUserId: string;
  status: Extract<PreCheckinStatus, "approved" | "rejected">;
  reviewNotes?: string | null;
}

export interface ListPreCheckinFilter {
  status?: SubmittedPreCheckinStatus;
}

export interface PreCheckinSubmissionRepository {
  findForEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<PreCheckinSubmission | null>;

  listForEvent(
    eventId: string,
    filter?: ListPreCheckinFilter,
  ): Promise<PreCheckinSubmission[]>;

  // Attendee path. Idempotent: same (event_id, user_id) re-submits update
  // the row, the unique constraint guards races. Adapter maps 23505 →
  // re-fetch + retry as an update (matches the sponsor/speaker attach
  // pattern).
  upsertOwn(input: UpsertOwnPreCheckinInput): Promise<PreCheckinSubmission>;

  // Staff path. Sets status + reviewer_user_id + reviewed_at in one shot.
  reviewByStaff(input: ReviewPreCheckinInput): Promise<PreCheckinSubmission>;
}
