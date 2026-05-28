// Domain entity: EventContent
// Bilingual content blocks attached to an event. JSONB on the DB side; here
// it's expressed as concrete TS shapes so use-cases and view code don't need
// to drill through `unknown`.

export interface EventHero {
  tagline_es?: string;
  tagline_en?: string;
  lede_es?: string;
  lede_en?: string;
}

export interface AgendaSlot {
  time: string;
  dur: number;
  title_es: string;
  title_en: string;
  track: string | null;
  room: string;
  speaker?: string;
}

export interface Speaker {
  name: string;
  role_es: string;
  role_en: string;
  city: string;
}

export interface Sponsor {
  name: string;
}

export interface FAQ {
  q_es: string;
  q_en: string;
  a_es: string;
  a_en: string;
}

export interface SponsorTiers {
  platinum: Sponsor[];
  gold: Sponsor[];
  silver: Sponsor[];
  community: Sponsor[];
}

export interface EventContent {
  eventId: string;
  hero: EventHero;
  agenda: AgendaSlot[];
  speakers: Speaker[];
  sponsors: SponsorTiers;
  gallery: unknown[];
  faq: FAQ[];
}
