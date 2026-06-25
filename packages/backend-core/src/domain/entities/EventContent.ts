// Domain entity: EventContent
// JSONB content blocks attached to an event. As of 0007 and 0009, this
// only carries hero / gallery / faq — agenda, speakers and sponsors are
// all first-class relational entities reached via their own joins.

export interface EventHero {
  tagline_es?: string;
  tagline_en?: string;
  lede_es?: string;
  lede_en?: string;
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
  gallery: unknown[];
  faq: FAQ[];
}
