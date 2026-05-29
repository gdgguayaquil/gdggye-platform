// Sponsor — a partner attached to an event. Tier is free-text in v1
// (typical values: platinum, gold, silver, community) so chapters can
// adjust without a migration.

export interface Sponsor {
  id: string;
  eventId: string;
  name: string;
  tier: string | null;
  logoUrl: string | null;
  description: string | null;
  boothLabel: string | null;
  isActive: boolean;
  createdAt: Date;
}
