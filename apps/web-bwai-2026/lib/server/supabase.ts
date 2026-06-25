import "server-only";

import { cookies } from "next/headers";

import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  SupabaseAgendaSlotRepository,
  SupabaseConsentRepository,
  SupabaseEventContentRepository,
  SupabaseEventRepository,
  SupabaseEventSpeakerRepository,
  SupabaseEventSponsorRepository,
  SupabaseLeaderboardRepository,
  SupabasePointTransactionRepository,
  SupabaseRegistrationRepository,
  SupabaseSpeakerRepository,
  SupabaseSponsorRepository,
  SupabaseUserRepository,
} from "@gdggye/supabase-adapters";

// Build the Supabase server client for the current request, wired to
// Next's cookie store. The supabase-adapters package is intentionally
// next/headers-free so it doesn't pull next into backend-core's graph.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient({
    getAll() {
      return cookieStore
        .getAll()
        .map((c) => ({ name: c.name, value: c.value }));
    },
    setAll(cookiesToSet) {
      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
      }
    },
  });
}

// Bundle of read/write repos backed by the user-scoped (RLS-on) client.
// Use for paths where the operation is the user acting on their own data:
// completeProfile, accept{Terms,Privacy,SponsorConsent}, ensureRegistration,
// any read that public-or-self policies cover.
export async function getSupabaseRepos() {
  const supabase = await getSupabaseServerClient();
  return {
    supabase,
    eventRepo: new SupabaseEventRepository(supabase),
    contentRepo: new SupabaseEventContentRepository(supabase),
    userRepo: new SupabaseUserRepository(supabase),
    consentRepo: new SupabaseConsentRepository(supabase),
    registrationRepo: new SupabaseRegistrationRepository(supabase),
    speakerRepo: new SupabaseSpeakerRepository(supabase),
    eventSpeakerRepo: new SupabaseEventSpeakerRepository(supabase),
    sponsorRepo: new SupabaseSponsorRepository(supabase),
    eventSponsorRepo: new SupabaseEventSponsorRepository(supabase),
    agendaSlotRepo: new SupabaseAgendaSlotRepository(supabase),
    leaderboardRepo: new SupabaseLeaderboardRepository(supabase),
    pointTxRepo: new SupabasePointTransactionRepository(supabase),
  };
}

// Service-role bundle for paths that must bypass RLS — currently just the
// initial users-row bootstrap on first sign-in (no insert policy exists for
// attendees on `users`). In Sprint 4 the scan-write paths will also use this.
//
// IMPORTANT: never derive `userId` from anything but `supabase.auth.getUser()`
// when using the service client — RLS is the only thing stopping a forged ID,
// and we just disabled it.
export function getSupabaseServiceRepos() {
  const supabase = createSupabaseServiceClient();
  return {
    supabase,
    userRepo: new SupabaseUserRepository(supabase),
    registrationRepo: new SupabaseRegistrationRepository(supabase),
  };
}
