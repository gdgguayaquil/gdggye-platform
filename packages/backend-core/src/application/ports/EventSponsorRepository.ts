import type { EventSponsor } from "../../domain/entities/EventSponsor";

export interface AttachSponsorInput {
  eventId: string;
  sponsorId: string;
  tier?: string | null;
  boothLabel?: string | null;
  isActive?: boolean;
}

export interface UpdateEventSponsorInput {
  tier?: string | null;
  boothLabel?: string | null;
  isActive?: boolean;
}

export interface EventSponsorRepository {
  findById(id: string): Promise<EventSponsor | null>;
  findByEventAndSponsor(
    eventId: string,
    sponsorId: string,
  ): Promise<EventSponsor | null>;
  listForEvent(eventId: string): Promise<EventSponsor[]>;

  // Idempotent attach. Re-attaching with new tier values updates the
  // existing row instead of creating a duplicate (unique on event+sponsor).
  attach(input: AttachSponsorInput): Promise<EventSponsor>;
  update(id: string, patch: UpdateEventSponsorInput): Promise<EventSponsor>;
  detach(id: string): Promise<void>;
}
