import type {
  Event,
  EventRepository,
  ListEventsFilter,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import { rowToEvent } from "./mappers";

type AnySupabaseClient = SupabaseServerClient | SupabaseBrowserClient;

export class SupabaseEventRepository implements EventRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  async findBySlug(slug: string): Promise<Event | null> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      throw new Error(`SupabaseEventRepository.findBySlug: ${error.message}`);
    }
    return data ? rowToEvent(data) : null;
  }

  async list(filter?: ListEventsFilter): Promise<Event[]> {
    let query = this.client
      .from("events")
      .select("*")
      .order("start_at", { ascending: true });

    if (filter?.status && filter.status.length > 0) {
      query = query.in("status", filter.status);
    }
    if (filter?.year !== undefined) {
      query = query.eq("year", filter.year);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`SupabaseEventRepository.list: ${error.message}`);
    }
    return (data ?? []).map(rowToEvent);
  }
}
