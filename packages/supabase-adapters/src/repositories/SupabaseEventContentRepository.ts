import type {
  EventContent,
  EventContentRepository,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import { rowToEventContent } from "./mappers";

type AnySupabaseClient = SupabaseServerClient | SupabaseBrowserClient;

export class SupabaseEventContentRepository implements EventContentRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  async findByEventId(eventId: string): Promise<EventContent | null> {
    const { data, error } = await this.client
      .from("event_content")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();
    if (error) {
      throw new Error(
        `SupabaseEventContentRepository.findByEventId: ${error.message}`,
      );
    }
    return data ? rowToEventContent(data) : null;
  }
}
