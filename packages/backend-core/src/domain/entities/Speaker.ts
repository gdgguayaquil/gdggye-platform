// Global speaker identity. Reusable across events (the same person can be
// attached to BWAI 2026 and DevFest 2026 with one row here, and their
// photo + bio survives event years).
//
// Per-event presentation knobs (display order, headliner flag, track,
// active toggle) live on EventSpeaker.

export interface Speaker {
  id: string;
  slug: string;
  name: string;
  roleEs: string | null;
  roleEn: string | null;
  city: string | null;
  bioEs: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
