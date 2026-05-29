import "server-only";

import { redirect } from "next/navigation";

import { signInBootstrap, type User } from "@gdggye/backend-core";

import {
  getSupabaseRepos,
  getSupabaseServerClient,
  getSupabaseServiceRepos,
} from "./supabase";

// Returns the auth.users row from the cookie session, or null. Doesn't touch
// public.users — that's `getCurrentUser` below.
export async function getCurrentAuthUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Returns the app-side User (with profile + consents) for the signed-in
// session. Triggers signInBootstrap on first call so the public.users row
// always exists for an authenticated session.
export async function getCurrentUser(): Promise<User | null> {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const { userRepo } = await getSupabaseRepos();
  const existing = await userRepo.findById(authUser.id);
  if (existing) return existing;

  // First login: bootstrap via the service client. The service path is
  // necessary because there is no insert policy on `public.users` (see
  // migration 0004). Defense in depth: we pass auth.uid()-derived data only.
  const { userRepo: serviceUserRepo } = getSupabaseServiceRepos();
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  return signInBootstrap(
    {
      id: authUser.id,
      email: authUser.email ?? "",
      googleId: typeof meta.sub === "string" ? meta.sub : null,
      fullName:
        typeof meta.full_name === "string"
          ? meta.full_name
          : typeof meta.name === "string"
            ? meta.name
            : "",
      photoUrl:
        typeof meta.avatar_url === "string"
          ? meta.avatar_url
          : typeof meta.picture === "string"
            ? meta.picture
            : null,
    },
    { userRepo: serviceUserRepo },
  );
}

// Redirects to /sign-in if not authenticated. Returns the User otherwise.
export async function requireUser(
  redirectTo: string = "/sign-in",
): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}
