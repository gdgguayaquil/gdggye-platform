// Activity — a points-bearing thing a sponsor offers at an event
// (e.g., "demo a deploy in 5 minutes" or "talk to our recruiter").
// `qrRotationSeconds` is a dormant field per Phase 2 spec (Model A: static
// printed QR + signed token); kept in the schema for future hardening.

export interface Activity {
  id: string;
  sponsorId: string;
  eventId: string;
  name: string;
  points: number;
  startsAt: Date | null;
  endsAt: Date | null;
  qrRotationSeconds: number;
  isActive: boolean;
  createdAt: Date;
}
