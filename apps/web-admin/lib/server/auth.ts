import "server-only";

import { redirect } from "next/navigation";

import { signInBootstrap, type User } from "@gdggye/backend-core";

import {
  getSupabaseRepos,
  getSupabaseServerClient,
  getSupabaseServiceRepos,
} from "./supabase";

export async function getCurrentAuthUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const { userRepo } = await getSupabaseRepos();
  const existing = await userRepo.findById(authUser.id);
  if (existing) return existing;

  // Bootstrap is unlikely from the admin app (admins are seeded by SQL),
  // but if a freshly-promoted account signs in here first, the path works.
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

export async function requireUser(
  redirectTo: string = "/sign-in",
): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

// Admin-only gate: kicks attendees back to /sign-in with a clear marker.
// Defense-in-depth: RLS will reject staff writes by attendees regardless,
// but this gives the user a clean error instead of a silent 500.
export async function requireStaff(): Promise<User> {
  const user = await requireUser();
  if (user.systemRole === "attendee") {
    redirect("/sign-in?error=not_staff");
  }
  return user;
}
