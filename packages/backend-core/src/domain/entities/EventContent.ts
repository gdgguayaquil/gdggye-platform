// Domain entity: EventContent
// JSONB content blocks attached to an event. As of 0007 this only carries
// hero / agenda / gallery / faq — speakers and sponsors are first-class
// relational entities reached via their own joins.

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

export interface FAQ {
  q_es: string;
  q_en: string;
  a_es: string;
  a_en: string;
}

export interface EventContent {
  eventId: string;
  hero: EventHero;
  agenda: AgendaSlot[];
  gallery: unknown[];
  faq: FAQ[];
}
