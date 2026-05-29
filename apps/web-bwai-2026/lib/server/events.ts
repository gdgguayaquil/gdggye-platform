import "server-only";

import {
  getEventBySlug as getEventBySlugUseCase,
  getEventContent as getEventContentUseCase,
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
