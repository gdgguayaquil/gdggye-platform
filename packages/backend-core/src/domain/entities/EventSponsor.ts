// EventSponsor — the (event × sponsor) attachment. Carries the per-event
// presentation (tier, booth label) and active flag. One row per
// (event_id, sponsor_id); enforced by DB unique constraint.

export interface EventSponsor {
  id: string;
  eventId: string;
  sponsorId: string;
  tier: string | null;
  boothLabel: string | null;
  isActive: boolean;
  createdAt: Date;
}
