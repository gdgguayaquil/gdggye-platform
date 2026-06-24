// Sponsor — global identity. Reusable across events. The per-event
// attachment (with tier + booth label) lives in EventSponsor.

export interface Sponsor {
  id: string;
  slug: string; // stable, unique
  name: string;
  logoUrl: string | null;
  description: string | null;
  websiteUrl: string | null;
  defaultTier: string | null; // pre-fill hint when attaching
  createdAt: Date;
  updatedAt: Date;
}
