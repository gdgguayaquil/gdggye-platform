import type { EventSpeaker } from "../../domain/entities/EventSpeaker";

export interface AttachSpeakerInput {
  eventId: string;
  speakerId: string;
  displayOrder?: number;
  track?: string | null;
  isHeadliner?: boolean;
  isActive?: boolean;
}

export interface UpdateEventSpeakerInput {
  displayOrder?: number;
  track?: string | null;
  isHeadliner?: boolean;
  isActive?: boolean;
}

export interface EventSpeakerRepository {
  findById(id: string): Promise<EventSpeaker | null>;
  findByEventAndSpeaker(
    eventId: string,
    speakerId: string,
  ): Promise<EventSpeaker | null>;
  listForEvent(eventId: string): Promise<EventSpeaker[]>;

  // Idempotent. Re-attaching with new values updates the existing row
  // instead of creating a duplicate. The unique constraint on
  // (event_id, speaker_id) is the final guard.
  attach(input: AttachSpeakerInput): Promise<EventSpeaker>;
  update(id: string, patch: UpdateEventSpeakerInput): Promise<EventSpeaker>;
  detach(id: string): Promise<void>;
}
