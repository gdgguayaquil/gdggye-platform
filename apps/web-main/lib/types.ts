export type Lang = "es" | "en";
export type ThemeMode = "light" | "dark";

export type EventType =
  | "build_with_ai"
  | "devfest"
  | "google_io"
  | "meetup"
  | "tech_talk"
  | "conference"
  | "workshop"
  | "hackathon";
export type EventStatus = "draft" | "published" | "live" | "closed";
export type EventAccent = "blue" | "green" | "yellow" | "red";

export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  type: EventType;
  year: number;
  status: EventStatus;
  accent: EventAccent;
  start_at: Date;
  end_at: Date;
  timezone?: string;
  venue_name: string;
  venue_short: string;
  venue_address: string;
  ticket_url: string;
  leaderboard_enabled: boolean;
  summary_es: string;
  summary_en: string;
  expected: string;
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

export interface EventDetail {
  hero: {
    tagline_es: string;
    tagline_en: string;
    lede_es: string;
    lede_en: string;
  };
  agenda: AgendaSlot[];
  speakers: Speaker[];
  sponsors: {
    platinum: Sponsor[];
    gold: Sponsor[];
    silver: Sponsor[];
    community: Sponsor[];
  };
  faq: FAQ[];
}
