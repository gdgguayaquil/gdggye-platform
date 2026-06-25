import "server-only";

import {
  getEventBySlug as getEventBySlugUseCase,
  getEventContent as getEventContentUseCase,
  getEventDetail as getEventDetailUseCase,
  getPublishedEvents as getPublishedEventsUseCase,
} from "@gdggye/backend-core";

import { getSupabaseRepos } from "./supabase";

// Thin app-side wrappers around the backend-core use-cases. Server components
// and route handlers call these; neither contains any business logic — the
// rules live in the use-cases (Option A discipline rule in CLAUDE.md).

export async function listPublishedEvents(input: { year?: number } = {}) {
  const { eventRepo } = await getSupabaseRepos();
  return getPublishedEventsUseCase(input, { eventRepo });
}

export async function findEventBySlug(slug: string) {
  const { eventRepo } = await getSupabaseRepos();
  return getEventBySlugUseCase({ slug }, { eventRepo });
}

export async function findEventContent(slug: string) {
  const { eventRepo, contentRepo } = await getSupabaseRepos();
  return getEventContentUseCase({ slug }, { eventRepo, contentRepo });
}

// Hydrated read for the marketing event-detail page. Resolves the event
// by slug first (so we 404 on draft slugs / typos via the use-case's domain
// rule), then joins content + speakers + sponsors.
export async function findEventDetail(slug: string) {
  const repos = await getSupabaseRepos();
  const event = await getEventBySlugUseCase(
    { slug },
    { eventRepo: repos.eventRepo },
  );
  if (!event) return null;
  const detail = await getEventDetailUseCase(event.id, {
    contentRepo: repos.contentRepo,
    eventSpeakerRepo: repos.eventSpeakerRepo,
    speakerRepo: repos.speakerRepo,
    eventSponsorRepo: repos.eventSponsorRepo,
    sponsorRepo: repos.sponsorRepo,
    agendaSlotRepo: repos.agendaSlotRepo,
  });
  return { event, detail };
}
