// Agenda slot — one session at an event. Replaces the old
// EventContent.agenda JSONB shape. The legacy JSON had a clock string
// ("09:00") + duration; this is now a real timestamptz so timezone
// arithmetic is correct everywhere.

export interface AgendaSlot {
  id: string;
  eventId: string;
  startAt: Date;
  durationMinutes: number;
  titleEs: string;
  titleEn: string;
  track: string | null;
  room: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
