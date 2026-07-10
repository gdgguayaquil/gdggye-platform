import type { Badge } from "../../domain/entities/Badge";

export interface BadgeRepository {
  // Active badge definitions that apply to this event: event-scoped
  // (event_id = eventId) plus global (event_id null). Public-read.
  listActiveForEvent(eventId: string): Promise<Badge[]>;
}
