import type { PreCheckinSubmission } from "../domain/entities/PreCheckinSubmission";
import type {
  ListPreCheckinFilter,
  PreCheckinSubmissionRepository,
  ReviewPreCheckinInput,
  UpsertOwnPreCheckinInput,
} from "../application/ports/PreCheckinSubmissionRepository";

// Idempotent upsertOwn matches the adapter contract: same (event_id,
// user_id) re-writes badge/dietary/etc. and bumps submittedAt/updatedAt.
// Staff reviewByStaff transitions pending → approved/rejected only; a
// double-review throws so the use-case's already_finalized guard is
// mirrored at the port layer for defense in depth.
export class InMemoryPreCheckinSubmissionRepository implements PreCheckinSubmissionRepository {
  readonly rows: PreCheckinSubmission[] = [];
  private counter = 0;
  now: () => Date = () => new Date("2026-05-01T12:00:00-05:00");

  constructor(seed: PreCheckinSubmission[] = []) {
    this.rows.push(...seed);
  }

  async findForEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<PreCheckinSubmission | null> {
    return (
      this.rows.find((r) => r.eventId === eventId && r.userId === userId) ??
      null
    );
  }

  async listForEvent(
    eventId: string,
    filter?: ListPreCheckinFilter,
  ): Promise<PreCheckinSubmission[]> {
    return this.rows.filter((r) => {
      if (r.eventId !== eventId) return false;
      if (filter?.status && r.status !== filter.status) return false;
      return true;
    });
  }

  async upsertOwn(
    input: UpsertOwnPreCheckinInput,
  ): Promise<PreCheckinSubmission> {
    const now = this.now();
    const existing = this.rows.find(
      (r) => r.eventId === input.eventId && r.userId === input.userId,
    );
    if (existing) {
      const updated: PreCheckinSubmission = {
        ...existing,
        badgeName: input.badgeName,
        photoConsent: input.photoConsent,
        dietary: input.dietary ?? null,
        tshirtSize: input.tshirtSize ?? null,
        notes: input.notes ?? null,
        submittedAt: now,
        updatedAt: now,
      };
      const idx = this.rows.indexOf(existing);
      this.rows[idx] = updated;
      return updated;
    }
    this.counter += 1;
    const created: PreCheckinSubmission = {
      id: `pc-${this.counter}`,
      eventId: input.eventId,
      userId: input.userId,
      status: "pending",
      badgeName: input.badgeName,
      photoConsent: input.photoConsent,
      dietary: input.dietary ?? null,
      tshirtSize: input.tshirtSize ?? null,
      notes: input.notes ?? null,
      reviewerUserId: null,
      reviewedAt: null,
      reviewNotes: null,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.push(created);
    return created;
  }

  async reviewByStaff(
    input: ReviewPreCheckinInput,
  ): Promise<PreCheckinSubmission> {
    const existing = this.rows.find((r) => r.id === input.id);
    if (!existing) {
      throw new Error(
        `InMemoryPreCheckinSubmissionRepository.reviewByStaff: ${input.id} not found`,
      );
    }
    if (existing.status !== "pending") {
      throw new Error(
        `InMemoryPreCheckinSubmissionRepository.reviewByStaff: ${input.id} is not pending`,
      );
    }
    const now = this.now();
    const updated: PreCheckinSubmission = {
      ...existing,
      status: input.status,
      reviewerUserId: input.reviewerUserId,
      reviewedAt: now,
      reviewNotes: input.reviewNotes ?? null,
      updatedAt: now,
    };
    const idx = this.rows.indexOf(existing);
    this.rows[idx] = updated;
    return updated;
  }
}
