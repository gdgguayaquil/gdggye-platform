// Per-event speaker attachment. Mirrors EventSponsor — the global Speaker
// row owns identity, this row owns the per-event presentation knobs.

export interface EventSpeaker {
  id: string;
  eventId: string;
  speakerId: string;
  displayOrder: number;
  track: string | null;
  isHeadliner: boolean;
  isActive: boolean;
  createdAt: Date;
}
