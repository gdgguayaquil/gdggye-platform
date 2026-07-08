// Pre-checkin submission for one attendee at one event.
//
// The canonical PreCheckinStatus union (defined on Registration) carries
// the 4-value app-side state including "not_submitted" — which is what
// the UI uses to render "you haven't submitted yet". A submission *row*
// can only carry the three real states, so we narrow here.

import type { PreCheckinStatus } from "./Registration";

export type SubmittedPreCheckinStatus = Exclude<
  PreCheckinStatus,
  "not_submitted"
>;

export interface PreCheckinSubmission {
  id: string;
  eventId: string;
  userId: string;
  status: SubmittedPreCheckinStatus;
  badgeName: string;
  photoConsent: boolean;
  dietary: string | null;
  tshirtSize: string | null;
  notes: string | null;
  reviewerUserId: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
